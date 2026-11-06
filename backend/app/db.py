"""Data layer for OrynexOpsera.

Two repository implementations share one interface:

* ``SupabaseRepository`` — used when SUPABASE_URL and
  SUPABASE_SERVICE_ROLE_KEY are configured. Talks to the ``opsera`` schema
  created by the migrations in ../supabase/migrations (service role only;
  tenant isolation is additionally enforced by RLS in Postgres).
* ``InMemoryRepository`` — development fallback used when no Supabase
  credentials are present. It starts COMPLETELY EMPTY: it exists so the API
  genuinely runs and is testable without credentials, not to simulate
  production data. This mode is logged loudly at startup and reported by
  GET /health. Data does not survive a restart.
"""

from __future__ import annotations

import copy
import logging
import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Protocol

from .config import settings

logger = logging.getLogger("opsera.db")

TABLES = (
    "organizations",
    "departments",
    "employees",
    "customers",
    "leads",
    "tasks",
    "ai_agents",
    "approval_requests",
    "audit_logs",
    "command_plans",
)


def new_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Repository(Protocol):
    mode: str

    def insert(self, table: str, record: dict[str, Any]) -> dict[str, Any]: ...
    def get(self, table: str, record_id: str) -> dict[str, Any] | None: ...
    def list(
        self,
        table: str,
        filters: dict[str, Any] | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]: ...
    def update(self, table: str, record_id: str, patch: dict[str, Any]) -> dict[str, Any] | None: ...
    def delete(self, table: str, record_id: str) -> bool: ...
    def count(self, table: str, filters: dict[str, Any] | None = None) -> int: ...


def _prepare(record: dict[str, Any]) -> dict[str, Any]:
    rec = dict(record)
    rec.setdefault("id", new_id())
    ts = now_iso()
    rec.setdefault("created_at", ts)
    rec["updated_at"] = ts
    return rec


def _matches(record: dict[str, Any], filters: dict[str, Any] | None) -> bool:
    if not filters:
        return True
    return all(record.get(k) == v for k, v in filters.items())


class InMemoryRepository:
    """Empty-at-boot in-memory store for credential-free development/testing."""

    mode = "in-memory (DEV ONLY — empty at boot, not persistent)"

    def __init__(self) -> None:
        self._data: dict[str, list[dict[str, Any]]] = {t: [] for t in TABLES}
        self._lock = threading.Lock()

    def insert(self, table: str, record: dict[str, Any]) -> dict[str, Any]:
        rec = _prepare(record)
        with self._lock:
            self._data[table].append(copy.deepcopy(rec))
        return copy.deepcopy(rec)

    def get(self, table: str, record_id: str) -> dict[str, Any] | None:
        with self._lock:
            for rec in self._data[table]:
                if rec["id"] == record_id and not rec.get("deleted_at"):
                    return copy.deepcopy(rec)
        return None

    def list(self, table, filters=None, limit=100, offset=0):
        with self._lock:
            rows = [
                copy.deepcopy(r)
                for r in self._data[table]
                if not r.get("deleted_at") and _matches(r, filters)
            ]
        return rows[offset : offset + limit]

    def update(self, table, record_id, patch):
        with self._lock:
            for rec in self._data[table]:
                if rec["id"] == record_id and not rec.get("deleted_at"):
                    rec.update(patch)
                    rec["updated_at"] = now_iso()
                    return copy.deepcopy(rec)
        return None

    def delete(self, table, record_id) -> bool:
        with self._lock:
            for rec in self._data[table]:
                if rec["id"] == record_id and not rec.get("deleted_at"):
                    rec["deleted_at"] = now_iso()  # soft delete
                    return True
        return False

    def count(self, table, filters=None) -> int:
        return len(self.list(table, filters=filters, limit=1_000_000))


class SupabaseRepository:
    """Supabase-backed repository (schema from OPSERA_SUPABASE_SCHEMA).

    Requires the Phase 1 migrations to have been applied to the target
    project. Uses the service-role key server-side only.
    """

    mode = "supabase"

    def __init__(self) -> None:
        from supabase import create_client  # imported lazily

        self._client = create_client(settings.supabase_url, settings.supabase_service_role_key)
        self._schema = settings.supabase_schema

    def _table(self, table: str):
        client = self._client
        schema_fn = getattr(client, "schema", None)
        if callable(schema_fn):
            return schema_fn(self._schema).table(table)
        return client.table(table)

    def insert(self, table, record):
        rec = _prepare(record)
        res = self._table(table).insert(rec).execute()
        return res.data[0]

    def get(self, table, record_id):
        res = self._table(table).select("*").eq("id", record_id).is_("deleted_at", "null").execute()
        return res.data[0] if res.data else None

    def list(self, table, filters=None, limit=100, offset=0):
        q = self._table(table).select("*").is_("deleted_at", "null")
        for k, v in (filters or {}).items():
            q = q.eq(k, v)
        res = q.range(offset, offset + limit - 1).execute()
        return res.data or []

    def update(self, table, record_id, patch):
        patch = {**patch, "updated_at": now_iso()}
        res = self._table(table).update(patch).eq("id", record_id).execute()
        return res.data[0] if res.data else None

    def delete(self, table, record_id) -> bool:
        res = self._table(table).update({"deleted_at": now_iso()}).eq("id", record_id).execute()
        return bool(res.data)

    def count(self, table, filters=None) -> int:
        return len(self.list(table, filters=filters, limit=1_000_000))


def build_repository() -> Repository:
    if settings.supabase_configured:
        try:
            repo = SupabaseRepository()
            logger.info("Repository: Supabase (schema=%s)", settings.supabase_schema)
            return repo
        except Exception as exc:  # pragma: no cover - depends on live Supabase
            logger.error("Supabase repository init failed (%s); falling back to in-memory DEV repository", exc)
    logger.warning(
        "DEV MODE: no Supabase credentials configured — using EMPTY in-memory "
        "repository. Data is real for this process only and is lost on restart. "
        "Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for persistence."
    )
    return InMemoryRepository()


def record_audit(
    repo: Repository,
    *,
    organization_id: str | None,
    actor: str,
    action: str,
    entity_type: str,
    entity_id: str | None,
    details: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return repo.insert(
        "audit_logs",
        {
            "organization_id": organization_id,
            "actor": actor,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details or {},
        },
    )
