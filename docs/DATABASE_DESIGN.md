# Database Design — Supabase PostgreSQL, schema `opsera`

Org isolation: every business table has `organization_id uuid -> organizations.id`, RLS policy `organization_id in (select organization_id from opsera.organization_members where user_id = auth.uid())`. Soft delete via `deleted_at` where appropriate. Audit via `audit_logs` + trigger-ready timestamps.

Core (§9): users(profile mirror), organizations, organization_members, roles, permissions, role_permissions, departments, employees, customers, leads, deals, invoices, transactions, expenses, budgets, projects, tasks (unified human+AI, §22: assignee_type, dependencies jsonb, status enum pending/assigned/in_progress/waiting_approval/blocked/completed/failed), campaigns, support_tickets, ai_agents (12 core + 13 creative + 15 engineering presets seeded), agent_assignments, agent_executions, workflows, workflow_executions, integrations, mcp_servers, connected_accounts (encrypted tokens, service-role only, RLS deny-all to anon/authenticated), approval_requests (risk_level enum), notifications, audit_logs, business_reports.

Extensions (§18-19): creative_projects, brand_assets, video_productions (stage-tracked, never script=video), repositories, dev_tasks, code_reviews.

Indexes: (organization_id, status) composites on tasks/deals/tickets/executions; pgvector deferred to Phase 5 (semantic search only).
