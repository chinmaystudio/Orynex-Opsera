"""Unified task system (spec §22) for human + AI assignees.

Creating a task whose risk_level is HIGH or CRITICAL is approval-gated:
the task is NOT created; an approval_request is returned instead (HTTP 202)
and the task is only created if the approval is approved
(routers/approvals.py executes the stored creation).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import JSONResponse

from ..db import Repository
from ..models import TaskCreate, TaskStatus, TaskUpdate
from ..rbac import Actor, gate_action, get_repo, needs_approval, require_permission
from .common import delete_record, get_or_404, require_org, create_record, update_record

router = APIRouter(prefix="/tasks", tags=["tasks"])


def task_payload(body: TaskCreate) -> dict:
    data = body.model_dump()
    data["status"] = body.status.value
    data["priority"] = body.priority.value
    data["assignee_type"] = body.assignee_type.value
    data["risk_level"] = body.risk_level.value
    return data


@router.post("")
def create_task(
    body: TaskCreate,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("tasks:create")),
):
    require_org(repo, body.organization_id)
    payload = task_payload(body)
    if needs_approval(body.risk_level):
        approval = gate_action(
            repo,
            organization_id=body.organization_id,
            actor=actor.user_id,
            action_type="tasks.create",
            title=f"Create {body.risk_level.value.upper()} task: {body.title}",
            description="Task creation at this risk level requires human approval before the task exists.",
            risk_level=body.risk_level,
            payload=payload,
        )
        return JSONResponse(
            status_code=202,
            content={
                "gated": True,
                "message": f"{body.risk_level.value.upper()} risk: task not created — approval requested.",
                "approval_request": approval,
            },
        )
    rec = create_record(repo, "tasks", payload, actor=actor.user_id)
    return JSONResponse(status_code=201, content=rec)


@router.get("")
def list_tasks(
    organization_id: str | None = None,
    status: TaskStatus | None = None,
    department_id: str | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("tasks:read")),
):
    filters: dict = {}
    if organization_id:
        filters["organization_id"] = organization_id
    if status:
        filters["status"] = status.value
    if department_id:
        filters["department_id"] = department_id
    return repo.list("tasks", filters=filters or None, limit=limit, offset=offset)


@router.get("/{task_id}")
def get_task(
    task_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("tasks:read")),
):
    return get_or_404(repo, "tasks", task_id)


@router.patch("/{task_id}")
def update_task(
    task_id: str,
    body: TaskUpdate,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("tasks:update")),
):
    data = body.model_dump()
    for key in ("status", "priority", "assignee_type", "risk_level"):
        if data.get(key) is not None:
            data[key] = data[key].value
    return update_record(repo, "tasks", task_id, data, actor=actor.user_id)


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("tasks:delete")),
):
    delete_record(repo, "tasks", task_id, actor=actor.user_id)
    return Response(status_code=204)
