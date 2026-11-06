"""Audit log reads (writes happen inside mutations via db.record_audit)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from ..db import Repository
from ..rbac import Actor, get_repo, require_permission

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("")
def list_audit_logs(
    organization_id: str | None = None,
    entity_type: str | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("audit:read")),
):
    filters: dict = {}
    if organization_id:
        filters["organization_id"] = organization_id
    if entity_type:
        filters["entity_type"] = entity_type
    rows = repo.list("audit_logs", filters=filters or None, limit=100_000)
    rows.sort(key=lambda r: r["created_at"], reverse=True)  # newest first
    return rows[offset : offset + limit]
