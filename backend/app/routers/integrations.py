"""Integration marketplace registry (spec §5B/§5D).

Honesty rule: an integration is NEVER reported as connected. Its status is
derived only from credential presence in the environment:

* ``not_configured``       — no credentials present (the default)
* ``configured_unverified``— credentials present, but no live adapter has
                             verified the connection yet (adapters ship in
                             Phase 3/4, so a "test" returns unverified,
                             never a fake success)
"""

from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from ..core_sdk import core_client
from ..mcp_server import mcp_status
from ..rbac import Actor, require_permission

router = APIRouter(prefix="/integrations", tags=["integrations"])

# (id, name, category, route, env_keys, phase_with_live_adapter)
_REGISTRY: list[tuple[str, str, str, str, tuple[str, ...], str]] = [
    # Communication
    ("gmail", "Gmail", "communication", "oauth", ("GMAIL_OAUTH_CLIENT_ID",), "phase_4"),
    ("outlook", "Microsoft Outlook", "communication", "oauth", (), "phase_4"),
    ("slack", "Slack", "communication", "oauth", ("SLACK_BOT_TOKEN",), "phase_4"),
    ("teams", "Microsoft Teams", "communication", "oauth", (), "phase_5"),
    ("telegram", "Telegram", "communication", "api_key", (), "phase_5"),
    ("whatsapp", "WhatsApp Business Cloud API", "communication", "api_key", (), "phase_5"),
    ("twilio", "Twilio (Voice + SMS)", "communication", "api_key", ("TWILIO_ACCOUNT_SID",), "phase_5"),
    # Productivity
    ("google-calendar", "Google Calendar", "productivity", "oauth", (), "phase_4"),
    ("google-drive", "Google Drive", "productivity", "oauth", (), "phase_4"),
    ("google-docs", "Google Docs", "productivity", "oauth", (), "phase_4"),
    ("google-sheets", "Google Sheets", "productivity", "oauth", (), "phase_4"),
    ("microsoft-365", "Microsoft 365 (Calendar/OneDrive/Excel)", "productivity", "oauth", (), "phase_4"),
    ("notion", "Notion", "productivity", "oauth", (), "phase_4"),
    # Development
    ("github", "GitHub", "development", "oauth", ("GITHUB_TOKEN",), "phase_3"),
    ("gitlab", "GitLab", "development", "oauth", (), "phase_4"),
    ("bitbucket", "Bitbucket", "development", "oauth", (), "phase_4"),
    # CRM & sales
    ("hubspot", "HubSpot", "crm", "oauth", (), "phase_4"),
    ("salesforce", "Salesforce", "crm", "oauth", (), "phase_4"),
    ("zoho-crm", "Zoho CRM", "crm", "oauth", (), "phase_4"),
    # Finance
    ("stripe", "Stripe", "finance", "api_key", ("STRIPE_SECRET_KEY",), "phase_4"),
    ("razorpay", "Razorpay", "finance", "api_key", (), "phase_4"),
    ("zoho-books", "Zoho Books", "finance", "oauth", (), "phase_4"),
    # HR
    ("zoho-people", "Zoho People", "hr", "api_key", (), "phase_4"),
    # AI & research
    ("openai", "OpenAI", "ai", "api_key", ("OPENAI_API_KEY",), "phase_2"),
    ("anthropic", "Anthropic", "ai", "api_key", ("ANTHROPIC_API_KEY",), "phase_2"),
    ("gemini", "Google Gemini", "ai", "api_key", ("GEMINI_API_KEY",), "phase_2"),
    ("perplexity", "Perplexity", "ai", "api_key", (), "phase_5"),
    # Creative (§18)
    ("canva", "Canva", "creative", "mcp/api", ("CANVA_API_KEY",), "phase_3"),
    ("adobe", "Adobe Creative Cloud / Firefly", "creative", "api", (), "phase_3"),
    ("figma", "Figma", "creative", "api", ("FIGMA_ACCESS_TOKEN",), "phase_3"),
    ("gamma", "Gamma", "creative", "api", (), "phase_3"),
    # Coding agents (§19)
    ("codex", "OpenAI Codex", "coding_agents", "api", (), "phase_3"),
    ("claude-code", "Claude Code", "coding_agents", "api/cli", (), "phase_3"),
    ("copilot", "GitHub Copilot", "coding_agents", "oauth", (), "phase_3"),
    ("cursor", "Cursor", "coding_agents", "api", (), "phase_3"),
    # Automation
    ("n8n", "n8n", "automation", "api", (), "phase_4"),
    ("webhooks", "Webhooks / Custom REST APIs", "automation", "api_key", (), "phase_4"),
    ("external-mcp", "External MCP Servers", "automation", "mcp", (), "phase_4"),
]


def _status(env_keys: tuple[str, ...]) -> str:
    if env_keys and any(os.environ.get(k) for k in env_keys):
        return "configured_unverified"
    return "not_configured"


def _entry(row) -> dict[str, Any]:
    pid, name, category, route, env_keys, phase = row
    return {
        "id": pid,
        "name": name,
        "category": category,
        "route": route,
        "status": _status(env_keys),
        "credential_env_keys": list(env_keys),
        "live_adapter_phase": phase,
    }


@router.get("")
def list_integrations(
    category: str | None = None,
    actor: Actor = Depends(require_permission("integrations:read")),
):
    entries = [_entry(r) for r in _REGISTRY]
    if category:
        entries = [e for e in entries if e["category"] == category]
    return {"count": len(entries), "integrations": entries}


@router.get("/core")
def orynex_core_status(actor: Actor = Depends(require_permission("integrations:read"))):
    return core_client.health()


@router.get("/mcp")
def opsera_mcp_status(actor: Actor = Depends(require_permission("integrations:read"))):
    return mcp_status()


@router.post("/{provider_id}/test")
def test_integration(
    provider_id: str,
    actor: Actor = Depends(require_permission("integrations:read")),
):
    for row in _REGISTRY:
        if row[0] == provider_id:
            entry = _entry(row)
            if entry["status"] == "not_configured":
                return {
                    **entry,
                    "test_result": "not_configured",
                    "detail": "No credentials configured for this provider; connect it before testing.",
                }
            return {
                **entry,
                "test_result": "unverified",
                "detail": f"Credentials are present but the live adapter ships in {entry['live_adapter_phase']}; connection not verified.",
            }
    raise HTTPException(status_code=404, detail=f"Unknown integration: {provider_id}")
