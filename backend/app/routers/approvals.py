"""Approval requests: list + decide.

Deciding executes ONLY the stored, bounded creations the Phase 1 gate can
produce (tasks/customers/leads creation, organization deletion). Command
plan execution is deliberately NOT performed here — it is stubbed as
``pending_phase_4`` because the workflow engine ships in Phase 4.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from ..db import Repository, now_iso, record_audit
from ..models import ApprovalDecision, ApprovalStatus
from ..rbac import Actor, get_repo, require_permission
from .common import get_or_404

router = APIRouter(prefix="/approvals", tags=["approvals"])

# action_type -> table for stored creations that Phase 1 may execute on approval.
_EXECUTABLE_CREATES = {
    "tasks.create": "tasks",
    "customers.create": "customers",
    "leads.create": "leads",
}


@router.get("")
def list_approvals(
    organization_id: str | None = None,
    status: ApprovalStatus | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("approvals:read")),
):
    filters: dict = {}
    if organization_id:
        filters["organization_id"] = organization_id
    if status:
        filters["status"] = status.value
    return repo.list("approval_requests", filters=filters or None, limit=limit, offset=offset)


@router.get("/{approval_id}")
def get_approval(
    approval_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("approvals:read")),
):
    return get_or_404(repo, "approval_requests", approval_id)


@router.post("/{approval_id}/decide")
def decide_approval(
    approval_id: str,
    body: ApprovalDecision,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("approvals:decide")),
):
    approval = get_or_404(repo, "approval_requests", approval_id)
    if approval["status"] != "pending":
        raise HTTPException(status_code=409, detail=f"Approval already decided: {approval['status']}")
    if body.decision not in (ApprovalStatus.APPROVED, ApprovalStatus.REJECTED):
        raise HTTPException(status_code=422, detail="decision must be 'approved' or 'rejected'")

    patch: dict = {
        "status": body.decision.value,
        "decided_by": actor.user_id,
        "decision_note": body.note,
        "decided_at": now_iso(),
    }

    if body.decision == ApprovalStatus.REJECTED:
        patch["execution_status"] = "not_executed"
    else:
        action_type = approval["action_type"]
        payload = approval.get("payload") or {}
        if action_type in _EXECUTABLE_CREATES:
            table = _EXECUTABLE_CREATES[action_type]
            created = repo.insert(table, dict(payload))
            patch["execution_status"] = "executed"
            patch["result_entity_id"] = created["id"]
            record_audit(
                repo,
                organization_id=approval.get("organization_id"),
                actor=actor.user_id,
                action=f"{table}.created_via_approval",
                entity_type=table,
                entity_id=created["id"],
                details={"approval_id": approval_id},
            )
        elif action_type == "organizations.delete":
            repo.delete("organizations", payload["organization_id"])
            patch["execution_status"] = "executed"
            patch["result_entity_id"] = payload["organization_id"]
        elif action_type == "command.execute_plan":
            # Honest stub: the plan was approved, but the Phase 4 workflow
            # engine that would execute it does not exist yet.
            patch["execution_status"] = "pending_phase_4"
        else:
            patch["execution_status"] = "pending_phase_4"

    updated = repo.update("approval_requests", approval_id, patch)
    record_audit(
        repo,
        organization_id=approval.get("organization_id"),
        actor=actor.user_id,
        action=f"approval.{body.decision.value}",
        entity_type="approval_request",
        entity_id=approval_id,
        details={"action_type": approval["action_type"], "execution_status": patch["execution_status"]},
    )
    return updated
