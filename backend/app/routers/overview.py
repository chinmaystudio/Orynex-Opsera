"""Executive Command Center overview.

Every number here is aggregated from records actually stored in the
repository — an empty organization reports zeros, never sample metrics.
Finance revenue/expense figures stay zero with an explanatory source note
until the Phase 3 finance module (invoices/transactions) exists.
"""

from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, Depends

from ..db import Repository, now_iso
from ..models import LeadStage, TaskStatus
from ..rbac import Actor, get_repo, require_permission

router = APIRouter(prefix="/overview", tags=["overview"])

_OPEN_TASK_STATUSES = {TaskStatus.PENDING.value, TaskStatus.ASSIGNED.value, TaskStatus.IN_PROGRESS.value, TaskStatus.BLOCKED.value, TaskStatus.WAITING_APPROVAL.value}


@router.get("")
def overview(
    organization_id: str | None = None,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("overview:read")),
):
    filters = {"organization_id": organization_id} if organization_id else None

    tasks = repo.list("tasks", filters=filters, limit=100_000)
    leads = repo.list("leads", filters=filters, limit=100_000)

    tasks_by_status = Counter(t["status"] for t in tasks)
    pipeline: dict[str, dict] = {}
    for stage in LeadStage:
        stage_leads = [l for l in leads if l["stage"] == stage.value]
        pipeline[stage.value] = {
            "count": len(stage_leads),
            "value": float(sum(float(l.get("value") or 0) for l in stage_leads)),
        }

    return {
        "organization_id": organization_id,
        "generated_at": now_iso(),
        "totals": {
            "departments": repo.count("departments", filters),
            "employees": repo.count("employees", filters),
            "customers": repo.count("customers", filters),
            "leads": len(leads),
            "tasks_total": len(tasks),
            "tasks_open": sum(1 for t in tasks if t["status"] in _OPEN_TASK_STATUSES),
            "agents_installed": repo.count("ai_agents", filters),
            "agents_active": len(
                repo.list("ai_agents", filters={**(filters or {}), "status": "active"}, limit=100_000)
            ),
            "pending_approvals": len(
                repo.list("approval_requests", filters={**(filters or {}), "status": "pending"}, limit=100_000)
            ),
        },
        "tasks_by_status": {s.value: tasks_by_status.get(s.value, 0) for s in TaskStatus},
        "sales_pipeline": pipeline,
        "sales_pipeline_total_value": float(sum(float(l.get("value") or 0) for l in leads)),
        "finance": {
            "revenue": 0.0,
            "expenses": 0.0,
            "profit": 0.0,
            "source": "No invoices/transactions recorded — finance module ships in Phase 3; figures are real zeros, not samples.",
        },
    }
