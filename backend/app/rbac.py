"""RBAC + risk/approval engine (spec §11).

Risk levels:
  LOW      — reading approved business information (executes immediately)
  MEDIUM   — creating tasks, drafts and internal records (executes immediately)
  HIGH     — external communications, publishing, modifying important records
  CRITICAL — payments, transfers, deleting important data, irreversible actions

HIGH and CRITICAL actions never execute directly: they create an
``approval_requests`` record and only run after a human approves it
(see routers/approvals.py). CRITICAL actions are never auto-executed by
agents even after approval in later phases without an explicit policy.
"""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, Request

from .db import Repository, record_audit
from .models import RiskLevel

RISK_ORDER = [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]


def risk_at_least(level: RiskLevel, threshold: RiskLevel) -> bool:
    return RISK_ORDER.index(level) >= RISK_ORDER.index(threshold)


def needs_approval(level: RiskLevel) -> bool:
    return risk_at_least(level, RiskLevel.HIGH)


# Canonical action -> risk mapping used by routers and the command planner.
ACTION_RISK: dict[str, RiskLevel] = {
    "read": RiskLevel.LOW,
    "search": RiskLevel.LOW,
    "research": RiskLevel.LOW,
    "generate_report": RiskLevel.LOW,
    "create_record": RiskLevel.MEDIUM,
    "create_task": RiskLevel.MEDIUM,
    "update_record": RiskLevel.MEDIUM,
    "draft_communication": RiskLevel.MEDIUM,
    "schedule": RiskLevel.MEDIUM,
    "send_external_communication": RiskLevel.HIGH,
    "publish_campaign": RiskLevel.HIGH,
    "modify_important_record": RiskLevel.HIGH,
    "delete_record": RiskLevel.HIGH,
    "delete_organization": RiskLevel.CRITICAL,
    "payment": RiskLevel.CRITICAL,
    "bank_transfer": RiskLevel.CRITICAL,
    "execute_workflow": RiskLevel.HIGH,
}

# Role -> permission set. Permissions are "<resource>:<action>".
_ALL_READ = {
    "organizations:read", "departments:read", "employees:read", "customers:read",
    "leads:read", "tasks:read", "agents:read", "approvals:read",
    "integrations:read", "audit:read", "overview:read", "command:read",
}
_WRITE_CORE = {
    "departments:create", "departments:update", "departments:delete",
    "employees:create", "employees:update", "employees:delete",
    "customers:create", "customers:update", "customers:delete",
    "leads:create", "leads:update", "leads:delete",
    "tasks:create", "tasks:update", "tasks:delete",
    "agents:create", "agents:update", "agents:delete",
    "command:create",
}

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "owner": {"*"},
    "admin": _ALL_READ | _WRITE_CORE | {
        "organizations:create", "organizations:update", "organizations:delete",
        "approvals:decide", "integrations:update",
    },
    "manager": _ALL_READ | _WRITE_CORE | {"approvals:decide"},
    "member": _ALL_READ | {
        "customers:create", "customers:update",
        "leads:create", "leads:update",
        "tasks:create", "tasks:update",
        "command:create",
    },
    "viewer": set(_ALL_READ),
    # AI agents act through the API with a bounded, read-mostly scope and may
    # never decide approvals or delete anything.
    "agent": {
        "organizations:read", "departments:read", "employees:read",
        "customers:read", "customers:create", "leads:read", "leads:create",
        "tasks:read", "tasks:create", "tasks:update",
        "agents:read", "overview:read",
    },
}

ROLES = tuple(ROLE_PERMISSIONS.keys())


def has_permission(role: str, permission: str) -> bool:
    perms = ROLE_PERMISSIONS.get(role, set())
    return "*" in perms or permission in perms


@dataclass
class Actor:
    user_id: str
    role: str


def get_actor(
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
) -> Actor:
    """Phase 1 actor context.

    In production this is derived from the verified Supabase JWT / ORYNEX
    CORE SSO token (Phase 6). Until then, callers may pass X-User-Id /
    X-User-Role headers; the default is a local admin so the dev API is
    usable without credentials. Unknown roles are rejected.
    """
    role = (x_user_role or "admin").lower()
    if role not in ROLE_PERMISSIONS:
        raise HTTPException(status_code=400, detail=f"Unknown role: {role}")
    return Actor(user_id=x_user_id or "dev-user", role=role)


def require_permission(permission: str):
    def _dep(actor: Actor = Depends(get_actor)) -> Actor:
        if not has_permission(actor.role, permission):
            raise HTTPException(
                status_code=403,
                detail=f"Role '{actor.role}' lacks permission '{permission}'",
            )
        return actor

    return _dep


def get_repo(request: Request) -> Repository:
    return request.app.state.repo


def gate_action(
    repo: Repository,
    *,
    organization_id: str | None,
    actor: str,
    action_type: str,
    title: str,
    description: str,
    risk_level: RiskLevel,
    payload: dict,
) -> dict | None:
    """Approval gate.

    Returns an approval_request record when the action is HIGH/CRITICAL
    (caller must NOT execute the action), or None when it may proceed.
    """
    if not needs_approval(risk_level):
        return None
    approval = repo.insert(
        "approval_requests",
        {
            "organization_id": organization_id,
            "action_type": action_type,
            "title": title,
            "description": description,
            "risk_level": risk_level.value,
            "payload": payload,
            "status": "pending",
            "requested_by": actor,
            "decided_by": None,
            "decision_note": None,
            "decided_at": None,
            "execution_status": "not_executed",
            "result_entity_id": None,
        },
    )
    record_audit(
        repo,
        organization_id=organization_id,
        actor=actor,
        action="approval.requested",
        entity_type="approval_request",
        entity_id=approval["id"],
        details={"action_type": action_type, "risk_level": risk_level.value},
    )
    return approval
