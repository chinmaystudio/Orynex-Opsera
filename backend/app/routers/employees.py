"""Employees CRUD (human workforce records, org-scoped)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response

from ..db import Repository
from ..models import EmployeeCreate, EmployeeUpdate
from ..rbac import Actor, get_repo, require_permission
from .common import create_record, delete_record, get_or_404, require_org, update_record

router = APIRouter(prefix="/employees", tags=["employees"])


@router.post("", status_code=201)
def create_employee(
    body: EmployeeCreate,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("employees:create")),
):
    require_org(repo, body.organization_id)
    if body.department_id:
        get_or_404(repo, "departments", body.department_id)
    return create_record(repo, "employees", body.model_dump(), actor=actor.user_id)


@router.get("")
def list_employees(
    organization_id: str | None = None,
    department_id: str | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("employees:read")),
):
    filters: dict = {}
    if organization_id:
        filters["organization_id"] = organization_id
    if department_id:
        filters["department_id"] = department_id
    return repo.list("employees", filters=filters or None, limit=limit, offset=offset)


@router.get("/{employee_id}")
def get_employee(
    employee_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("employees:read")),
):
    return get_or_404(repo, "employees", employee_id)


@router.patch("/{employee_id}")
def update_employee(
    employee_id: str,
    body: EmployeeUpdate,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("employees:update")),
):
    return update_record(repo, "employees", employee_id, body.model_dump(), actor=actor.user_id)


@router.delete("/{employee_id}", status_code=204)
def delete_employee(
    employee_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("employees:delete")),
):
    delete_record(repo, "employees", employee_id, actor=actor.user_id)
    return Response(status_code=204)
