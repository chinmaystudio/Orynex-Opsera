"""Shared helpers for resource routers."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException

from ..db import Repository, record_audit


def get_or_404(repo: Repository, table: str, record_id: str) -> dict[str, Any]:
    rec = repo.get(table, record_id)
    if rec is None:
        raise HTTPException(status_code=404, detail=f"{table[:-1]} not found: {record_id}")
    return rec


def require_org(repo: Repository, organization_id: str) -> dict[str, Any]:
    return get_or_404(repo, "organizations", organization_id)


def create_record(
    repo: Repository,
    table: str,
    payload: dict[str, Any],
    *,
    actor: str,
    action: str | None = None,
) -> dict[str, Any]:
    rec = repo.insert(table, payload)
    record_audit(
        repo,
        organization_id=rec.get("organization_id"),
        actor=actor,
        action=action or f"{table}.created",
        entity_type=table,
        entity_id=rec["id"],
    )
    return rec


def update_record(
    repo: Repository,
    table: str,
    record_id: str,
    patch: dict[str, Any],
    *,
    actor: str,
) -> dict[str, Any]:
    existing = get_or_404(repo, table, record_id)
    clean = {k: v for k, v in patch.items() if v is not None}
    rec = repo.update(table, record_id, clean)
    record_audit(
        repo,
        organization_id=existing.get("organization_id"),
        actor=actor,
        action=f"{table}.updated",
        entity_type=table,
        entity_id=record_id,
        details={"fields": sorted(clean.keys())},
    )
    return rec  # type: ignore[return-value]


def delete_record(
    repo: Repository,
    table: str,
    record_id: str,
    *,
    actor: str,
) -> None:
    existing = get_or_404(repo, table, record_id)
    repo.delete(table, record_id)
    record_audit(
        repo,
        organization_id=existing.get("organization_id"),
        actor=actor,
        action=f"{table}.deleted",
        entity_type=table,
        entity_id=record_id,
    )
