# OrynexOpsera — AI-Native Business Operating System (ORYNEX ecosystem)

Phase 1 foundation built & verified 2026-11-06. See docs/ for plan, architecture, DB design, integration inventory.

## Run locally
```bash
# Backend (FastAPI, port 8000) — dev mode uses an EMPTY in-memory repo until Supabase env vars are set
cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000
# Frontend (React+Vite, port 5173)
cd frontend && npm run dev
# Tests
cd backend && .venv/bin/python -m pytest tests/ -q   # 17 passed
```

## Status (honest)
- Phase 1: DONE — app shell (16 modules), Command Center on real aggregates, AI Workforce (40 presets), Tasks/Approvals with HIGH/CRITICAL approval gating, RBAC, audit logs, 37-table Supabase migrations with RLS (SQL-parse validated; live `supabase db push` still pending a Supabase project decision).
- Integrations: registry only, all `not_configured`. MCP server + workflow execution: Phase 4. Auth: header-based dev actor; Supabase JWT / ORYNEX CORE SSO in Phase 6.
