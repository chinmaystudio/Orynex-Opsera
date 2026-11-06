"""Organizations CRUD. Deleting an organization is CRITICAL risk and is
approval-gated (spec §11)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import JSONResponse

from ..db import Repository
from ..models import OrganizationCreate, OrganizationUpdate, RiskLevel
from ..rbac import Actor, gate_action, get_repo, require_permission
from .common import create_record, delete_record, get_or_404, update_record

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.post("", status_code=201)
def create_org(
    body: OrganizationCreate,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("organizations:create")),
):
    return create_record(repo, "organizations", body.model_dump(), actor=actor.user_id)


@router.get("")
def list_orgs(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("organizations:read")),
):
    return repo.list("organizations", limit=limit, offset=offset)


@router.get("/{org_id}")
def get_org(
    org_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("organizations:read")),
):
    return get_or_404(repo, "organizations", org_id)


@router.patch("/{org_id}")
def update_org(
    org_id: str,
    body: OrganizationUpdate,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("organizations:update")),
):
    return update_record(repo, "organizations", org_id, body.model_dump(), actor=actor.user_id)


@router.delete("/{org_id}")
def delete_org(
    org_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("organizations:delete")),
):
    org = get_or_404(repo, "organizations", org_id)
    approval = gate_action(
        repo,
        organization_id=org_id,
        actor=actor.user_id,
        action_type="organizations.delete",
        title=f"Delete organization '{org['name']}'",
        description="Deleting an organization is a CRITICAL, irreversible action and requires approval.",
        risk_level=RiskLevel.CRITICAL,
        payload={"organization_id": org_id},
    )
    if approval is not None:
        return JSONResponse(
            status_code=202,
            content={
                "gated": True,
                "message": "CRITICAL action gated: approval required before the organization is deleted.",
                "approval_request": approval,
            },
        )
    delete_record(repo, "organizations", org_id, actor=actor.user_id)
    return Response(status_code=204)
