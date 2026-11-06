"""OrynexOpsera MCP server — PHASE 4 PLACEHOLDER.

This module is intentionally NOT a working MCP server yet. It defines the
registry of the 20 tools specified in spec §5A so the surface is designed,
versioned and reviewable in Phase 1. The real server (Phase 4) will add:

* Streamable HTTP + stdio transports for Claude / ChatGPT / dev clients
* OAuth 2.1 / scoped token authentication with organization isolation
* Tool-level authorization mapped onto app/rbac.py permissions
* Audit logging of every tool call, rate limiting, input validation
* Resources (business overview documents) and prompt templates

Every tool below carries its planned risk level and required permission so
the Phase 4 implementation inherits the §11 approval policy: HIGH/CRITICAL
tools must route through approval_requests and never execute directly.
"""

from __future__ import annotations

from typing import Any

MCP_SERVER_INFO = {
    "name": "orynex-opsera",
    "version": "0.1.0-planned",
    "status": "planned_phase_4",
    "transports_planned": ["streamable-http", "stdio"],
    "auth_planned": "OAuth 2.1 / scoped bearer tokens, organization-isolated",
}

# (name, description, risk_level, required_permission)
_TOOLS: list[tuple[str, str, str, str]] = [
    ("get_business_overview", "Aggregated business state for the caller's organization", "low", "overview:read"),
    ("get_revenue_summary", "Revenue summary for a period (Phase 3 finance data)", "low", "overview:read"),
    ("get_expense_summary", "Expense summary for a period (Phase 3 finance data)", "low", "overview:read"),
    ("get_sales_pipeline", "Leads/deals by stage with values", "low", "leads:read"),
    ("get_customer_details", "One customer record by id", "low", "customers:read"),
    ("search_customers", "Search customers by name/company/industry", "low", "customers:read"),
    ("create_customer", "Create a customer record", "medium", "customers:create"),
    ("update_customer", "Update a customer record", "medium", "customers:update"),
    ("create_lead", "Create a lead in the pipeline", "medium", "leads:create"),
    ("assign_sales_representative", "Assign a lead to a sales representative", "medium", "leads:update"),
    ("create_invoice", "Create an invoice (Phase 3 finance)", "high", "invoices:create"),
    ("get_invoice_status", "Invoice status by id (Phase 3 finance)", "low", "invoices:read"),
    ("create_business_task", "Create a task in the unified task system", "medium", "tasks:create"),
    ("get_employee_details", "One employee record by id", "low", "employees:read"),
    ("schedule_meeting", "Schedule a meeting via connected calendar", "medium", "calendar:write"),
    ("create_marketing_campaign", "Create a marketing campaign (draft)", "medium", "campaigns:create"),
    ("get_campaign_analytics", "Campaign performance analytics", "low", "campaigns:read"),
    ("execute_approved_workflow", "Execute a workflow that already has human approval", "high", "workflows:execute"),
    ("get_agent_status", "Status and recent executions of an installed AI agent", "low", "agents:read"),
    ("deploy_agent", "Install/deploy an agent from the registry into an organization", "high", "agents:create"),
    ("generate_business_report", "Generate a business report from authorised data", "low", "overview:read"),
]

MCP_TOOLS: list[dict[str, Any]] = [
    {
        "name": name,
        "description": description,
        "version": "v1-planned",
        "risk_level": risk,
        "required_permission": perm,
        "status": "planned_phase_4",
    }
    for (name, description, risk, perm) in _TOOLS
]

MCP_RESOURCES_PLANNED = [
    {"uri_template": "opsera://org/{organization_id}/overview", "description": "Business overview document"},
    {"uri_template": "opsera://org/{organization_id}/reports/{report_id}", "description": "Generated business reports"},
]

MCP_PROMPTS_PLANNED = [
    {"name": "executive_briefing", "description": "Daily executive briefing from authorised business data"},
    {"name": "sales_followup_plan", "description": "Follow-up plan for stale pipeline leads"},
]


def mcp_status() -> dict[str, Any]:
    return {
        **MCP_SERVER_INFO,
        "tools_registered": len(MCP_TOOLS),
        "detail": "Registry defined in Phase 1; the MCP server itself ships in Phase 4 and is not running yet.",
    }


def create_mcp_server() -> Any:
    """Placeholder factory — deliberately not a fake server."""
    raise NotImplementedError(
        "The OrynexOpsera MCP server ships in Phase 4. "
        "See MCP_TOOLS in app/mcp_server.py for the planned, versioned tool registry."
    )
