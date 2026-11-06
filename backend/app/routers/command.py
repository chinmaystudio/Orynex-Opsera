"""Natural Language Business Command Center (spec §7).

Phase 1 behaviour — PLAN ONLY. A command is parsed into a structured,
ordered execution plan where every step carries a risk level and an
approval flag. The plan is returned for user review/approval and stored
with an audit entry. NOTHING is executed and the response never claims
otherwise: executing an approved plan is the Phase 4 workflow engine's
job. If the plan contains HIGH/CRITICAL steps, an approval_request of
type ``command.execute_plan`` is created alongside it.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ..db import Repository, new_id, now_iso, record_audit
from ..models import CommandRequest, RiskLevel
from ..rbac import ACTION_RISK, RISK_ORDER, Actor, gate_action, needs_approval, get_repo, require_permission

router = APIRouter(prefix="/command", tags=["command"])

# (keywords, action, description template, tools)
_RULES: list[tuple[tuple[str, ...], str, str, list[str]]] = [
    (("find", "potential customers", "prospect", "lead generation"), "search",
     "Search for prospects/customers matching the request criteria", ["crm", "web-research"]),
    (("research",), "research",
     "Research the target companies/people and compile sourced findings", ["web-research"]),
    (("create lead", "add lead", "new lead"), "create_record",
     "Create lead records in the CRM from the research results", ["crm"]),
    (("create customer", "add customer", "new customer", "register"), "create_record",
     "Create customer records in the CRM", ["crm"]),
    (("draft", "write", "prepare", "personalized email", "outreach email"), "draft_communication",
     "Draft personalised outreach content for review", ["email"]),
    (("send", "email", "outreach", "mail"), "send_external_communication",
     "Send the approved communication to external recipients", ["email", "whatsapp", "slack"]),
    (("follow up", "follow-up", "followup"), "schedule",
     "Schedule follow-up tasks/reminders", ["tasks", "calendar"]),
    (("schedule", "meeting", "book"), "schedule",
     "Schedule the requested meetings/tasks", ["calendar", "tasks"]),
    (("update crm", "update my crm", "update the crm"), "update_record",
     "Update CRM records with the outcome", ["crm"]),
    (("report", "analyse", "analyze", "analysis", "summary"), "generate_report",
     "Generate a report/analysis from authorised business data", ["reports", "analytics"]),
    (("assign",), "create_task",
     "Create and assign tasks to the appropriate employees/agents", ["tasks"]),
    (("create task", "create a task", "add task"), "create_task",
     "Create tasks in the unified task system", ["tasks"]),
    (("campaign",), "draft_communication",
     "Draft the marketing campaign plan and content", ["campaigns", "content"]),
    (("publish", "post"), "publish_campaign",
     "Publish the approved campaign/content", ["campaigns", "social"]),
    (("pay", "payment", "transfer", "refund"), "payment",
     "Execute a payment/transfer — CRITICAL, never automated without explicit approval policy", ["finance"]),
    (("delete", "remove all", "purge"), "delete_record",
     "Delete the specified records", ["database"]),
    (("invoice",), "create_record",
     "Create invoice records (execution lands with the Phase 3 finance module)", ["finance"]),
    (("onboard", "automation", "automate", "workflow"), "execute_workflow",
     "Create/run the requested automation workflow (engine ships in Phase 4)", ["workflows"]),
]


def parse_command(command: str) -> list[dict]:
    text = command.lower()
    matched: list[tuple[int, str, str, list[str]]] = []
    seen_actions: set[str] = set()
    for keywords, action, description, tools in _RULES:
        positions = [text.find(k) for k in keywords if k in text]
        if positions and action not in seen_actions:
            matched.append((min(positions), action, description, tools))
            seen_actions.add(action)
    matched.sort(key=lambda m: m[0])  # keep the user's stated order

    steps: list[dict] = []
    for i, (_pos, action, description, tools) in enumerate(matched, start=1):
        risk = ACTION_RISK.get(action, RiskLevel.MEDIUM)
        steps.append(
            {
                "order": i,
                "action": action,
                "description": description,
                "tools": tools,
                "risk_level": risk,
                "requires_approval": needs_approval(risk),
            }
        )
    if not steps:
        steps = [
            {
                "order": 1,
                "action": "generate_report",
                "description": "Analyse the request against authorised business data and report findings",
                "tools": ["analytics"],
                "risk_level": RiskLevel.LOW,
                "requires_approval": False,
            },
            {
                "order": 2,
                "action": "create_task",
                "description": "Create a follow-up task for a human to action anything the analysis surfaces",
                "tools": ["tasks"],
                "risk_level": RiskLevel.MEDIUM,
                "requires_approval": False,
            },
        ]
    return steps


@router.post("", status_code=201)
def create_plan(
    body: CommandRequest,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("command:create")),
):
    steps = parse_command(body.command)
    max_risk = max((s["risk_level"] for s in steps), key=lambda r: RISK_ORDER.index(r))
    requires_approval = any(s["requires_approval"] for s in steps)
    plan = {
        "id": new_id(),
        "organization_id": body.organization_id,
        "command": body.command,
        "requested_by": body.requested_by or actor.user_id,
        "status": "awaiting_approval" if requires_approval else "planned",
        "max_risk_level": max_risk.value,
        "requires_approval": requires_approval,
        "steps": [
            {**s, "risk_level": s["risk_level"].value} for s in steps
        ],
        "execution_status": "not_executed",
        "note": (
            "Plan only — nothing has been executed. Review the steps and risk "
            "levels; execution of approved plans ships with the Phase 4 "
            "workflow/automation engine."
        ),
        "created_at": now_iso(),
    }
    stored = repo.insert("command_plans", plan)
    record_audit(
        repo,
        organization_id=body.organization_id,
        actor=actor.user_id,
        action="command.plan_created",
        entity_type="command_plan",
        entity_id=stored["id"],
        details={"max_risk_level": max_risk.value, "steps": len(steps)},
    )
    if requires_approval:
        gate_action(
            repo,
            organization_id=body.organization_id,
            actor=actor.user_id,
            action_type="command.execute_plan",
            title=f"Execute command plan: {body.command[:80]}",
            description="This plan contains HIGH/CRITICAL steps and requires approval before any Phase 4 execution.",
            risk_level=max_risk,
            payload={"plan_id": stored["id"]},
        )
    return stored


@router.get("/plans")
def list_plans(
    organization_id: str | None = None,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("command:read")),
):
    filters = {"organization_id": organization_id} if organization_id else None
    return repo.list("command_plans", filters=filters, limit=100)
