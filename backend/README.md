# OrynexOpsera — Backend (Phase 1)

FastAPI + Pydantic v2 backend for the ORYNEX Business Operating System.
Stack per spec §10: Python 3.12, FastAPI, PostgreSQL via Supabase.

## Run

```bash
cd backend
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env        # optional in dev mode
.venv/bin/uvicorn app.main:app --reload --port 8000
```

- Health: `GET /health` — reports repository mode honestly.
- OpenAPI docs: `/docs`
- API prefix: `/api/v1`

## Dev mode vs Supabase

With no credentials, the API runs on an **empty in-memory repository**
(starts with zero records, loses data on restart, loudly logged as
`DEV MODE`). This is a real, testable API — not mock production data.

Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (and apply the migrations
in `../supabase/migrations/`) to switch to the Supabase repository; the
repository interface (`app/db.py`) is identical either way.

## Tests

```bash
.venv/bin/python -m pytest tests/ -q
```

17 tests: health, org→department→employee→task CRUD flow, customer/lead
CRUD, overview aggregates (zeros when empty, isolation between orgs),
HIGH/CRITICAL approval gating (gated task does not exist until approved;
rejection never executes; org delete is CRITICAL-gated), command plan
shape (plan-only, `execution_status: not_executed`, payment = CRITICAL),
40 agent presets (12 core / 13 creative / 15 engineering), RBAC (viewer
cannot mutate), audit logging, honest `not_configured` integrations.

## Key design points

- **RBAC + risk engine** (`app/rbac.py`): roles owner/admin/manager/
  member/viewer/agent with `<resource>:<action>` permissions; risk levels
  LOW/MEDIUM/HIGH/CRITICAL. HIGH+ actions create `approval_requests` and
  do not execute until `POST /api/v1/approvals/{id}/decide` approves them.
  Actor identity comes from `X-User-Id` / `X-User-Role` headers in Phase 1;
  production auth is Supabase JWT / ORYNEX CORE SSO (Phase 6).
- **Command center** (`app/routers/command.py`): parses natural language
  into an ordered plan with per-step risk + approval flags. It never
  claims execution — approved plan execution is the Phase 4 workflow
  engine, tracked as `pending_phase_4` on the approval record.
- **Overview** (`app/routers/overview.py`): every figure is aggregated
  from stored records; finance shows real zeros with a source note until
  the Phase 3 finance module exists.
- **Integrations** (`app/routers/integrations.py`): registry of 37
  providers; status is `not_configured` unless credentials exist in the
  environment, then only `configured_unverified` — never fake "connected".
- **ORYNEX CORE** (`app/core_sdk.py`): interface only; raises
  `CoreNotConfiguredError` / returns `not_configured` until CORE
  credentials are set (real transport Phase 6). No other app's database
  is ever accessed.
- **MCP server** (`app/mcp_server.py`): Phase 4 placeholder — the
  versioned registry of the tools named in spec §5A (21 entries incl.
  `generate_business_report`), each with risk level + required permission.
  `create_mcp_server()` raises `NotImplementedError` by design.
- **Audit**: every mutation writes an `audit_logs` record; read via
  `GET /api/v1/audit`.

## Layout

```
app/
  main.py            app factory, /health, router mounting
  config.py          env-only settings (no hardcoded secrets)
  db.py              Repository protocol, InMemory + Supabase impls, audit writer
  models.py          Pydantic v2 schemas + enums
  rbac.py            roles, permissions, risk levels, approval gate, actor deps
  agents_presets.py  all 40 preset AI employees as data
  core_sdk.py        ORYNEX CORE client interface (not_configured-honest)
  mcp_server.py      Phase 4 MCP placeholder + tool registry
  routers/           organizations, departments, employees, customers, leads,
                     tasks, agents, approvals, overview, command,
                     integrations, audit
tests/               pytest suite
```
