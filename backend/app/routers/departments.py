"""Departments CRUD (org-scoped)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response

from ..db import Repository
from ..models import DepartmentCreate, DepartmentUpdate
from ..rbac import Actor, get_repo, require_permission
from .common import create_record, delete_record, get_or_404, require_org, update_record

router = APIRouter(prefix="/departments", tags=["departments"])


@router.post("", status_code=201)
def create_department(
    body: DepartmentCreate,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("departments:create")),
):
    require_org(repo, body.organization_id)
    return create_record(repo, "departments", body.model_dump(), actor=actor.user_id)


@router.get("")
def list_departments(
    organization_id: str | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("departments:read")),
):
    filters = {"organization_id": organization_id} if organization_id else None
    return repo.list("departments", filters=filters, limit=limit, offset=offset)


@router.get("/{department_id}")
def get_department(
    department_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("departments:read")),
):
    return get_or_404(repo, "departments", department_id)


@router.patch("/{department_id}")
def update_department(
    department_id: str,
    body: DepartmentUpdate,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("departments:update")),
):
    return update_record(repo, "departments", department_id, body.model_dump(), actor=actor.user_id)


@router.delete("/{department_id}", status_code=204)
def delete_department(
    department_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("departments:delete")),
):
    delete_record(repo, "departments", department_id, actor=actor.user_id)
    return Response(status_code=204)
