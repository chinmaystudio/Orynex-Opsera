# Implementation Plan — phases per spec §15 (+ §18-24 extensions folded in)

- Phase 1 (THIS BUILD): foundation — repo, auth-shaped app shell, orgs/departments, Executive Command Center wired to real backend aggregates (empty-state honest, no fake metrics), 16-module navigation, DB migrations + RLS, RBAC + risk/approval engine, agent registry with all 40 preset AI employees (12 core + 13 creative + 15 engineering) seeded as data.
- Phase 2: AI Workforce UI, Aegis registry sync via CORE, deployment, execution history.
- Phase 3: CRM/Sales, Finance, HR, Operations, Creative Studio, Engineering Studio workspaces.
- Phase 4: Automation center (visual builder + NL->workflow with approval), MCP server + client, integration adapters (GitHub/Gmail/Stripe first).
- Phase 5: Voice (Twilio), comms, BI engine.
- Phase 6: ORYNEX CORE SSO/events, cross-app workflows, marketplace, billing/usage, hardening.

Verification per phase: frontend `tsc + vite build`, backend `pytest`, migrations SQL-linted; no feature marked done without a run.
