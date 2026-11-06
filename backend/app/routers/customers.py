"""Customers CRUD (org-scoped)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response

from ..db import Repository
from ..models import CustomerCreate, CustomerUpdate
from ..rbac import Actor, get_repo, require_permission
from .common import create_record, delete_record, get_or_404, require_org, update_record

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("", status_code=201)
def create_customer(
    body: CustomerCreate,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("customers:create")),
):
    require_org(repo, body.organization_id)
    return create_record(repo, "customers", body.model_dump(), actor=actor.user_id)


@router.get("")
def list_customers(
    organization_id: str | None = None,
    industry: str | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("customers:read")),
):
    filters: dict = {}
    if organization_id:
        filters["organization_id"] = organization_id
    if industry:
        filters["industry"] = industry
    return repo.list("customers", filters=filters or None, limit=limit, offset=offset)


@router.get("/{customer_id}")
def get_customer(
    customer_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("customers:read")),
):
    return get_or_404(repo, "customers", customer_id)


@router.patch("/{customer_id}")
def update_customer(
    customer_id: str,
    body: CustomerUpdate,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("customers:update")),
):
    return update_record(repo, "customers", customer_id, body.model_dump(), actor=actor.user_id)


@router.delete("/{customer_id}", status_code=204)
def delete_customer(
    customer_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("customers:delete")),
):
    delete_record(repo, "customers", customer_id, actor=actor.user_id)
    return Response(status_code=204)
