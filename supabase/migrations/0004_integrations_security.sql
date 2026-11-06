-- 0004_integrations_security.sql — integrations, MCP servers, connected accounts (vault), approvals, audit (§§5, 11)

create table opsera.integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  provider text not null,
  category text not null check (category in ('communication','productivity','development','crm','finance','hr','ai','creative','coding','automation','orynex_core')),
  name text not null,
  -- Honest status: stays 'not_configured' until real credentials exist and a connection test passes.
  status opsera.integration_status not null default 'not_configured',
  auth_type text not null default 'oauth' check (auth_type in ('oauth','api_key','mcp','webhook','none')),
  scopes jsonb not null default '[]'::jsonb,
  capabilities jsonb not null default '[]'::jsonb,
  config jsonb not null default '{}'::jsonb,
  health jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  connected_by uuid references opsera.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, provider)
);
create index integrations_org_status_idx on opsera.integrations (organization_id, status);
create index integrations_org_category_idx on opsera.integrations (organization_id, category);

create table opsera.mcp_servers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  transport text not null default 'streamable_http' check (transport in ('streamable_http','sse','stdio')),
  endpoint_url text,
  status opsera.integration_status not null default 'not_configured',
  is_opsera_server boolean not null default false,
  version text not null default '1.0.0',
  tools jsonb not null default '[]'::jsonb,
  resources jsonb not null default '[]'::jsonb,
  scopes jsonb not null default '[]'::jsonb,
  registered_by uuid references opsera.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, slug)
);
create index mcp_servers_org_status_idx on opsera.mcp_servers (organization_id, status);

-- VAULT: OAuth tokens / API keys live here ONLY, stored encrypted (AES/pgcrypto or KMS envelope
-- encryption applied by the backend before insert; ciphertext columns only, never plaintext).
-- RLS is DENY-ALL for anon and authenticated: only the service role (which bypasses RLS in
-- Supabase) may read or write this table. Tokens are never exposed to the frontend.
create table opsera.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  integration_id uuid references opsera.integrations(id) on delete set null,
  mcp_server_id uuid references opsera.mcp_servers(id) on delete set null,
  provider text not null,
  external_account_id text,
  status opsera.integration_status not null default 'not_configured',
  access_token_encrypted bytea,
  refresh_token_encrypted bytea,
  api_key_encrypted bytea,
  encryption_key_id text,
  scopes jsonb not null default '[]'::jsonb,
  expires_at timestamptz,
  connected_by uuid references opsera.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index connected_accounts_org_status_idx on opsera.connected_accounts (organization_id, status);
create index connected_accounts_provider_idx on opsera.connected_accounts (organization_id, provider);

-- ============ APPROVALS (§11 risk engine) ============
create table opsera.approval_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  title text not null,
  description text,
  action_type text not null,
  risk_level opsera.risk_level not null default 'medium',
  status opsera.approval_status not null default 'pending',
  requested_by_user_id uuid references opsera.users(id) on delete set null,
  requested_by_agent_id uuid references opsera.ai_agents(id) on delete set null,
  workflow_execution_id uuid references opsera.workflow_executions(id) on delete set null,
  agent_execution_id uuid references opsera.agent_executions(id) on delete set null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  decision_note text,
  decided_by uuid references opsera.users(id) on delete set null,
  decided_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index approval_requests_org_status_idx on opsera.approval_requests (organization_id, status);
create index approval_requests_org_risk_idx on opsera.approval_requests (organization_id, risk_level, status);

-- ============ AUDIT ============
create table opsera.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  actor_type text not null default 'user' check (actor_type in ('user','agent','system','mcp_client')),
  actor_user_id uuid references opsera.users(id) on delete set null,
  actor_agent_id uuid references opsera.ai_agents(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  risk_level opsera.risk_level,
  ip_address inet,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_org_created_idx on opsera.audit_logs (organization_id, created_at desc);
create index audit_logs_org_entity_idx on opsera.audit_logs (organization_id, entity_type, entity_id);

-- ============ TRIGGERS ============
create trigger trg_integrations_updated_at before update on opsera.integrations for each row execute function opsera.set_updated_at();
create trigger trg_mcp_servers_updated_at before update on opsera.mcp_servers for each row execute function opsera.set_updated_at();
create trigger trg_connected_accounts_updated_at before update on opsera.connected_accounts for each row execute function opsera.set_updated_at();
create trigger trg_approval_requests_updated_at before update on opsera.approval_requests for each row execute function opsera.set_updated_at();

-- ============ RLS ============
alter table opsera.integrations enable row level security;
alter table opsera.mcp_servers enable row level security;
alter table opsera.connected_accounts enable row level security;
alter table opsera.approval_requests enable row level security;
alter table opsera.audit_logs enable row level security;

create policy integrations_org_isolation on opsera.integrations for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy mcp_servers_org_isolation on opsera.mcp_servers for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));

-- Deny-all for end-user roles: no SELECT/INSERT/UPDATE/DELETE policy is granted to anon or
-- authenticated, and the explicit deny policies below make that intent unambiguous.
-- Only the service role may access encrypted credentials.
create policy connected_accounts_deny_anon on opsera.connected_accounts for all to anon using (false) with check (false);
create policy connected_accounts_deny_authenticated on opsera.connected_accounts for all to authenticated using (false) with check (false);
revoke all on opsera.connected_accounts from anon, authenticated;
grant all on opsera.connected_accounts to service_role;

create policy approval_requests_org_isolation on opsera.approval_requests for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));

-- Audit logs: members may read their org's log; writes are service-role/system only (no insert/update/delete policy for authenticated).
create policy audit_logs_org_read on opsera.audit_logs for select to authenticated using (opsera.is_org_member(organization_id));
revoke insert, update, delete on opsera.audit_logs from authenticated, anon;

grant select, insert, update, delete on opsera.integrations, opsera.mcp_servers, opsera.approval_requests to authenticated;
grant select on opsera.audit_logs to authenticated;
grant all on opsera.integrations, opsera.mcp_servers, opsera.approval_requests, opsera.audit_logs to service_role;
