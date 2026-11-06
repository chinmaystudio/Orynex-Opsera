"""Leads CRUD + pipeline (org-scoped)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response

from ..db import Repository
from ..models import LeadCreate, LeadStage, LeadUpdate
from ..rbac import Actor, get_repo, require_permission
from .common import create_record, delete_record, get_or_404, require_org, update_record

router = APIRouter(prefix="/leads", tags=["leads"])


def _dump(model) -> dict:
    data = model.model_dump()
    if isinstance(data.get("stage"), LeadStage):
        data["stage"] = data["stage"].value
    return data


@router.post("", status_code=201)
def create_lead(
    body: LeadCreate,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("leads:create")),
):
    require_org(repo, body.organization_id)
    return create_record(repo, "leads", _dump(body), actor=actor.user_id)


@router.get("")
def list_leads(
    organization_id: str | None = None,
    stage: LeadStage | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("leads:read")),
):
    filters: dict = {}
    if organization_id:
        filters["organization_id"] = organization_id
    if stage:
        filters["stage"] = stage.value
    return repo.list("leads", filters=filters or None, limit=limit, offset=offset)


@router.get("/{lead_id}")
def get_lead(
    lead_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("leads:read")),
):
    return get_or_404(repo, "leads", lead_id)


@router.patch("/{lead_id}")
def update_lead(
    lead_id: str,
    body: LeadUpdate,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("leads:update")),
):
    return update_record(repo, "leads", lead_id, _dump(body), actor=actor.user_id)


@router.delete("/{lead_id}", status_code=204)
def delete_lead(
    lead_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("leads:delete")),
):
    delete_record(repo, "leads", lead_id, actor=actor.user_id)
    return Response(status_code=204)
