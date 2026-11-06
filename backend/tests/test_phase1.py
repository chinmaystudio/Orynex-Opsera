"""Phase 1 backend tests: health, CRUD flow, overview aggregates,
approval gating, command plan shape, RBAC, presets, honest integrations."""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

API = "/api/v1"


@pytest.fixture()
def client():
    # Fresh app per test => fresh EMPTY in-memory repository.
    with TestClient(create_app()) as c:
        yield c


def make_org(client, name="Acme Corp"):
    r = client.post(f"{API}/organizations", json={"name": name, "owner_email": "o@acme.test"})
    assert r.status_code == 201, r.text
    return r.json()


# ---------------------------------------------------------------- health
def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "in-memory" in body["repository"]  # dev mode is explicit, not hidden
    assert body["supabase_configured"] is False


# ---------------------------------------------------------------- CRUD flow
def test_org_department_task_flow(client):
    org = make_org(client)
    org_id = org["id"]

    r = client.post(f"{API}/departments", json={"organization_id": org_id, "name": "Sales", "code": "SALES"})
    assert r.status_code == 201, r.text
    dept = r.json()
    assert dept["organization_id"] == org_id

    r = client.post(
        f"{API}/employees",
        json={"organization_id": org_id, "full_name": "Priya Nair", "department_id": dept["id"], "role": "manager"},
    )
    assert r.status_code == 201, r.text

    r = client.post(
        f"{API}/tasks",
        json={
            "organization_id": org_id,
            "title": "Prepare Q3 pipeline review",
            "department_id": dept["id"],
            "assignee_type": "human",
            "priority": "high",
        },
    )
    assert r.status_code == 201, r.text
    task = r.json()
    assert task["status"] == "pending"
    assert task["risk_level"] == "medium"

    r = client.get(f"{API}/tasks", params={"organization_id": org_id})
    assert r.status_code == 200
    assert [t["id"] for t in r.json()] == [task["id"]]

    r = client.patch(f"{API}/tasks/{task['id']}", json={"status": "in_progress"})
    assert r.status_code == 200
    assert r.json()["status"] == "in_progress"

    r = client.delete(f"{API}/tasks/{task['id']}")
    assert r.status_code == 204
    assert client.get(f"{API}/tasks/{task['id']}").status_code == 404


def test_customer_and_lead_crud(client):
    org_id = make_org(client)["id"]
    r = client.post(
        f"{API}/customers",
        json={"organization_id": org_id, "name": "MediCare Ltd", "industry": "healthcare"},
    )
    assert r.status_code == 201
    customer = r.json()

    r = client.post(
        f"{API}/leads",
        json={"organization_id": org_id, "name": "MediCare Ltd", "stage": "qualified", "value": 5000, "customer_id": customer["id"]},
    )
    assert r.status_code == 201
    assert r.json()["stage"] == "qualified"
    assert client.get(f"{API}/leads", params={"organization_id": org_id, "stage": "qualified"}).json()[0]["value"] == 5000


def test_org_scoped_404s(client):
    assert client.get(f"{API}/organizations/nope").status_code == 404
    r = client.post(f"{API}/departments", json={"organization_id": "missing-org", "name": "X"})
    assert r.status_code == 404


# ---------------------------------------------------------------- overview
def test_overview_empty_is_zeros(client):
    org_id = make_org(client)["id"]
    body = client.get(f"{API}/overview", params={"organization_id": org_id}).json()
    assert body["totals"]["customers"] == 0
    assert body["totals"]["tasks_total"] == 0
    assert body["sales_pipeline_total_value"] == 0
    assert body["finance"]["revenue"] == 0.0


def test_overview_aggregates_real_data(client):
    org_id = make_org(client)["id"]
    client.post(f"{API}/departments", json={"organization_id": org_id, "name": "Sales"})
    client.post(f"{API}/customers", json={"organization_id": org_id, "name": "A"})
    client.post(f"{API}/customers", json={"organization_id": org_id, "name": "B"})
    client.post(f"{API}/leads", json={"organization_id": org_id, "name": "L1", "stage": "new", "value": 100})
    client.post(f"{API}/leads", json={"organization_id": org_id, "name": "L2", "stage": "won", "value": 250})
    client.post(f"{API}/tasks", json={"organization_id": org_id, "title": "T1"})

    body = client.get(f"{API}/overview", params={"organization_id": org_id}).json()
    assert body["totals"]["departments"] == 1
    assert body["totals"]["customers"] == 2
    assert body["totals"]["leads"] == 2
    assert body["totals"]["tasks_open"] == 1
    assert body["sales_pipeline"]["new"] == {"count": 1, "value": 100.0}
    assert body["sales_pipeline"]["won"] == {"count": 1, "value": 250.0}
    assert body["sales_pipeline_total_value"] == 350.0

    # A different organization sees none of it (isolation of aggregates).
    other_id = make_org(client, "Other Co")["id"]
    other = client.get(f"{API}/overview", params={"organization_id": other_id}).json()
    assert other["totals"]["customers"] == 0


# ---------------------------------------------------------------- approvals
def test_high_risk_task_is_gated_then_created_on_approval(client):
    org_id = make_org(client)["id"]
    r = client.post(
        f"{API}/tasks",
        json={"organization_id": org_id, "title": "Email all customers", "risk_level": "high"},
    )
    assert r.status_code == 202, r.text
    body = r.json()
    assert body["gated"] is True
    approval = body["approval_request"]
    assert approval["status"] == "pending"
    assert approval["risk_level"] == "high"

    # The gated task must NOT exist yet.
    assert client.get(f"{API}/tasks", params={"organization_id": org_id}).json() == []
    # ... and it counts as a pending approval in the overview.
    ov = client.get(f"{API}/overview", params={"organization_id": org_id}).json()
    assert ov["totals"]["pending_approvals"] == 1

    r = client.post(f"{API}/approvals/{approval['id']}/decide", json={"decision": "approved"})
    assert r.status_code == 200, r.text
    decided = r.json()
    assert decided["status"] == "approved"
    assert decided["execution_status"] == "executed"

    tasks = client.get(f"{API}/tasks", params={"organization_id": org_id}).json()
    assert len(tasks) == 1 and tasks[0]["title"] == "Email all customers"
    assert tasks[0]["id"] == decided["result_entity_id"]


def test_rejected_approval_never_executes(client):
    org_id = make_org(client)["id"]
    r = client.post(
        f"{API}/tasks",
        json={"organization_id": org_id, "title": "Wire money", "risk_level": "critical"},
    )
    approval_id = r.json()["approval_request"]["id"]
    r = client.post(f"{API}/approvals/{approval_id}/decide", json={"decision": "rejected", "note": "no"})
    assert r.json()["execution_status"] == "not_executed"
    assert client.get(f"{API}/tasks", params={"organization_id": org_id}).json() == []
    # Double-decide is a conflict.
    assert client.post(f"{API}/approvals/{approval_id}/decide", json={"decision": "approved"}).status_code == 409


def test_delete_organization_is_critical_gated(client):
    org = make_org(client)
    r = client.delete(f"{API}/organizations/{org['id']}")
    assert r.status_code == 202
    assert r.json()["approval_request"]["risk_level"] == "critical"
    assert client.get(f"{API}/organizations/{org['id']}").status_code == 200  # still there
    approval_id = r.json()["approval_request"]["id"]
    client.post(f"{API}/approvals/{approval_id}/decide", json={"decision": "approved"})
    assert client.get(f"{API}/organizations/{org['id']}").status_code == 404


# ---------------------------------------------------------------- command
def test_command_plan_shape_and_no_execution_claim(client):
    org_id = make_org(client)["id"]
    cmd = (
        "Find potential customers in the healthcare industry, research their companies, "
        "create personalized outreach emails, send them after my approval, "
        "follow up after three days and update my CRM."
    )
    r = client.post(f"{API}/command", json={"organization_id": org_id, "command": cmd})
    assert r.status_code == 201, r.text
    plan = r.json()
    assert plan["execution_status"] == "not_executed"
    assert plan["requires_approval"] is True
    assert plan["max_risk_level"] == "high"
    assert plan["status"] == "awaiting_approval"
    actions = [s["action"] for s in plan["steps"]]
    assert "research" in actions and "send_external_communication" in actions
    send_step = next(s for s in plan["steps"] if s["action"] == "send_external_communication")
    assert send_step["risk_level"] == "high" and send_step["requires_approval"] is True
    orders = [s["order"] for s in plan["steps"]]
    assert orders == sorted(orders)

    # A pending approval for plan execution was created; no leads were created.
    approvals = client.get(f"{API}/approvals", params={"organization_id": org_id}).json()
    assert any(a["action_type"] == "command.execute_plan" for a in approvals)
    assert client.get(f"{API}/leads", params={"organization_id": org_id}).json() == []


def test_command_low_risk_plan_needs_no_approval(client):
    r = client.post(f"{API}/command", json={"command": "Generate a sales performance report"})
    assert r.status_code == 201
    plan = r.json()
    assert plan["requires_approval"] is False
    assert plan["execution_status"] == "not_executed"


def test_command_payment_is_critical(client):
    r = client.post(f"{API}/command", json={"command": "Pay the vendor invoice"})
    plan = r.json()
    assert plan["max_risk_level"] == "critical"
    assert plan["requires_approval"] is True


# ---------------------------------------------------------------- agents
def test_agent_presets_all_40(client):
    presets = client.get(f"{API}/agents/presets").json()
    assert len(presets) == 40
    cats = {}
    for p in presets:
        cats[p["category"]] = cats.get(p["category"], 0) + 1
        assert p["risk_ceiling"] in ("low", "medium", "high", "critical")
        assert p["default_permissions"]
    assert cats == {"core": 12, "creative": 13, "engineering": 15}


def test_agent_install_pause_resume(client):
    org_id = make_org(client)["id"]
    r = client.post(f"{API}/agents/install", json={"organization_id": org_id, "preset_id": "sales-manager"})
    assert r.status_code == 201, r.text
    agent = r.json()
    assert agent["status"] == "active" and agent["preset_id"] == "sales-manager"

    body = client.get(f"{API}/agents", params={"organization_id": org_id}).json()
    assert len(body["presets"]) == 40 and len(body["installed"]) == 1

    r = client.post(f"{API}/agents/installed/{agent['id']}/pause")
    assert r.json()["status"] == "paused"
    r = client.post(f"{API}/agents/installed/{agent['id']}/resume")
    assert r.json()["status"] == "active"
    assert client.post(f"{API}/agents/install", json={"organization_id": org_id, "preset_id": "nope"}).status_code == 404


# ---------------------------------------------------------------- rbac/audit/integrations
def test_viewer_cannot_mutate(client):
    headers = {"X-User-Role": "viewer"}
    r = client.post(f"{API}/organizations", json={"name": "Nope"}, headers=headers)
    assert r.status_code == 403
    r = client.get(f"{API}/organizations", headers=headers)  # reads allowed
    assert r.status_code == 200


def test_audit_log_records_mutations(client):
    org_id = make_org(client)["id"]
    client.post(f"{API}/departments", json={"organization_id": org_id, "name": "Ops"})
    logs = client.get(f"{API}/audit", params={"organization_id": org_id}).json()
    actions = [l["action"] for l in logs]
    assert "departments.created" in actions


def test_integrations_are_honest_not_configured(client):
    body = client.get(f"{API}/integrations").json()
    assert body["count"] >= 30
    assert all(i["status"] == "not_configured" for i in body["integrations"])
    r = client.post(f"{API}/integrations/gmail/test")
    assert r.json()["test_result"] == "not_configured"
    core = client.get(f"{API}/integrations/core").json()
    assert core["status"] == "not_configured"
    mcp = client.get(f"{API}/integrations/mcp").json()
    assert mcp["status"] == "planned_phase_4" and mcp["tools_registered"] >= 20
