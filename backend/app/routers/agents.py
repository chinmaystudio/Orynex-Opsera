"""AI Workforce registry: 40 presets + per-organization installations."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from ..agents_presets import AGENT_PRESETS, PRESETS_BY_ID
from ..db import Repository
from ..models import AgentInstall, AgentStatus, AgentUpdate, RiskLevel
from ..rbac import RISK_ORDER, Actor, get_repo, require_permission
from .common import create_record, delete_record, get_or_404, require_org, update_record

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("")
def list_agents(
    organization_id: str | None = None,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("agents:read")),
):
    """Presets (all 40) plus agents installed into the given organization."""
    filters = {"organization_id": organization_id} if organization_id else None
    installed = repo.list("ai_agents", filters=filters, limit=500)
    return {"presets": AGENT_PRESETS, "installed": installed}


@router.get("/presets")
def list_presets(
    category: str | None = None,
    actor: Actor = Depends(require_permission("agents:read")),
):
    if category:
        return [p for p in AGENT_PRESETS if p["category"] == category]
    return AGENT_PRESETS


@router.get("/presets/{preset_id}")
def get_preset(
    preset_id: str,
    actor: Actor = Depends(require_permission("agents:read")),
):
    preset = PRESETS_BY_ID.get(preset_id)
    if preset is None:
        raise HTTPException(status_code=404, detail=f"Unknown agent preset: {preset_id}")
    return preset


@router.post("/install", status_code=201)
def install_agent(
    body: AgentInstall,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("agents:create")),
):
    require_org(repo, body.organization_id)
    preset = PRESETS_BY_ID.get(body.preset_id)
    if preset is None:
        raise HTTPException(status_code=404, detail=f"Unknown agent preset: {body.preset_id}")
    ceiling = body.risk_ceiling or RiskLevel(preset["risk_ceiling"])
    preset_ceiling = RiskLevel(preset["risk_ceiling"])
    if RISK_ORDER.index(ceiling) > RISK_ORDER.index(preset_ceiling):
        raise HTTPException(
            status_code=422,
            detail=f"risk_ceiling {ceiling.value} exceeds preset ceiling {preset_ceiling.value}",
        )
    record = {
        "organization_id": body.organization_id,
        "preset_id": preset["id"],
        "name": body.name or preset["name"],
        "role": preset["role"],
        "department": preset["department"],
        "department_id": body.department_id,
        "category": preset["category"],
        "description": preset["description"],
        "llm_model": body.llm_model or preset["default_llm"],
        "system_instructions": body.system_instructions or "",
        "tools": preset["tools"],
        "permissions": body.permissions or preset["default_permissions"],
        "risk_ceiling": ceiling.value,
        "memory_configuration": preset["memory_configuration"],
        "status": AgentStatus.ACTIVE.value,
    }
    return create_record(repo, "ai_agents", record, actor=actor.user_id, action="agents.installed")


@router.get("/installed/{agent_id}")
def get_installed(
    agent_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("agents:read")),
):
    return get_or_404(repo, "ai_agents", agent_id)


@router.patch("/installed/{agent_id}")
def update_installed(
    agent_id: str,
    body: AgentUpdate,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("agents:update")),
):
    data = body.model_dump()
    if data.get("risk_ceiling") is not None:
        data["risk_ceiling"] = data["risk_ceiling"].value
    if data.get("status") is not None:
        data["status"] = data["status"].value
    return update_record(repo, "ai_agents", agent_id, data, actor=actor.user_id)


@router.post("/installed/{agent_id}/pause")
def pause_agent(
    agent_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("agents:update")),
):
    return update_record(repo, "ai_agents", agent_id, {"status": AgentStatus.PAUSED.value}, actor=actor.user_id)


@router.post("/installed/{agent_id}/resume")
def resume_agent(
    agent_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("agents:update")),
):
    return update_record(repo, "ai_agents", agent_id, {"status": AgentStatus.ACTIVE.value}, actor=actor.user_id)


@router.delete("/installed/{agent_id}", status_code=204)
def remove_agent(
    agent_id: str,
    repo: Repository = Depends(get_repo),
    actor: Actor = Depends(require_permission("agents:delete")),
):
    delete_record(repo, "ai_agents", agent_id, actor=actor.user_id)
    return Response(status_code=204)
