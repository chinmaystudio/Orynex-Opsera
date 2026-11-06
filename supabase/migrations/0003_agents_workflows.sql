-- 0003_agents_workflows.sql — AI workforce registry, assignments, executions, workflows (§§3B, 4)
-- ai_agents.organization_id is NULLABLE: null = global template (preset / OrynexAegis catalog),
-- readable by all authenticated users; a non-null value is an org-owned copy/custom agent.

create table opsera.ai_agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references opsera.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  role text not null,
  description text,
  department_id uuid references opsera.departments(id) on delete set null,
  department_slug text,
  status text not null default 'active' check (status in ('active','paused','revoked','archived')),
  source text not null default 'custom' check (source in ('preset','aegis','custom')),
  is_template boolean not null default false,
  aegis_agent_id text,
  llm_provider text,
  model text,
  system_instructions text,
  tools jsonb not null default '[]'::jsonb,
  integrations jsonb not null default '[]'::jsonb,
  memory_config jsonb not null default '{}'::jsonb,
  knowledge_sources jsonb not null default '[]'::jsonb,
  permissions jsonb not null default '[]'::jsonb,
  execution_limits jsonb not null default '{}'::jsonb,
  approval_required boolean not null default false,
  max_risk_level opsera.risk_level not null default 'medium',
  performance_metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index ai_agents_global_slug_uq on opsera.ai_agents (slug) where organization_id is null and deleted_at is null;
create unique index ai_agents_org_slug_uq on opsera.ai_agents (organization_id, slug) where organization_id is not null and deleted_at is null;
create index ai_agents_org_status_idx on opsera.ai_agents (organization_id, status);
create index ai_agents_department_idx on opsera.ai_agents (department_slug, status);

create table opsera.workflows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','active','paused','archived')),
  trigger_type text not null default 'manual' check (trigger_type in ('manual','schedule','webhook','event','email','form')),
  trigger_config jsonb not null default '{}'::jsonb,
  definition jsonb not null default '{}'::jsonb,
  nodes jsonb not null default '[]'::jsonb,
  source_prompt text,
  created_by uuid references opsera.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index workflows_org_status_idx on opsera.workflows (organization_id, status);

create table opsera.workflow_executions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  workflow_id uuid not null references opsera.workflows(id) on delete cascade,
  status opsera.execution_status not null default 'queued',
  triggered_by uuid references opsera.users(id) on delete set null,
  trigger_payload jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb,
  output jsonb,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index workflow_executions_org_status_idx on opsera.workflow_executions (organization_id, status);
create index workflow_executions_workflow_idx on opsera.workflow_executions (workflow_id, created_at desc);

create table opsera.agent_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  agent_id uuid not null references opsera.ai_agents(id) on delete cascade,
  department_id uuid references opsera.departments(id) on delete set null,
  supervisor_employee_id uuid references opsera.employees(id) on delete set null,
  status text not null default 'active' check (status in ('active','paused','revoked')),
  permissions jsonb not null default '[]'::jsonb,
  execution_limits jsonb not null default '{}'::jsonb,
  approval_required boolean not null default false,
  assigned_by uuid references opsera.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, agent_id, department_id)
);
create index agent_assignments_org_status_idx on opsera.agent_assignments (organization_id, status);
create index agent_assignments_agent_idx on opsera.agent_assignments (agent_id, status);

create table opsera.agent_executions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  agent_id uuid not null references opsera.ai_agents(id) on delete cascade,
  assignment_id uuid references opsera.agent_assignments(id) on delete set null,
  workflow_execution_id uuid references opsera.workflow_executions(id) on delete set null,
  task_id uuid references opsera.tasks(id) on delete set null,
  status opsera.execution_status not null default 'queued',
  risk_level opsera.risk_level not null default 'low',
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error text,
  tool_calls jsonb not null default '[]'::jsonb,
  tokens_used int not null default 0,
  cost numeric(12,6) not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index agent_executions_org_status_idx on opsera.agent_executions (organization_id, status);
create index agent_executions_agent_created_idx on opsera.agent_executions (agent_id, created_at desc);

-- Back-fill FKs from 0002 tables that point at agents.
alter table opsera.tasks
  add constraint tasks_assignee_agent_fk
  foreign key (assignee_agent_id) references opsera.ai_agents(id) on delete set null;
alter table opsera.support_tickets
  add constraint support_tickets_assigned_agent_fk
  foreign key (assigned_agent_id) references opsera.ai_agents(id) on delete set null;
alter table opsera.business_reports
  add constraint business_reports_generated_by_agent_fk
  foreign key (generated_by_agent_id) references opsera.ai_agents(id) on delete set null;
create index tasks_assignee_agent_idx on opsera.tasks (assignee_agent_id, status) where assignee_agent_id is not null;

-- ============ TRIGGERS ============
create trigger trg_ai_agents_updated_at before update on opsera.ai_agents for each row execute function opsera.set_updated_at();
create trigger trg_workflows_updated_at before update on opsera.workflows for each row execute function opsera.set_updated_at();
create trigger trg_workflow_executions_updated_at before update on opsera.workflow_executions for each row execute function opsera.set_updated_at();
create trigger trg_agent_assignments_updated_at before update on opsera.agent_assignments for each row execute function opsera.set_updated_at();
create trigger trg_agent_executions_updated_at before update on opsera.agent_executions for each row execute function opsera.set_updated_at();

-- ============ RLS ============
alter table opsera.ai_agents enable row level security;
alter table opsera.workflows enable row level security;
alter table opsera.workflow_executions enable row level security;
alter table opsera.agent_assignments enable row level security;
alter table opsera.agent_executions enable row level security;

-- Global templates (organization_id null) are readable by everyone; org copies are org-isolated.
create policy ai_agents_read on opsera.ai_agents for select to authenticated
  using (organization_id is null or opsera.is_org_member(organization_id));
create policy ai_agents_org_write on opsera.ai_agents for insert to authenticated
  with check (organization_id is not null and opsera.is_org_member(organization_id));
create policy ai_agents_org_update on opsera.ai_agents for update to authenticated
  using (organization_id is not null and opsera.is_org_member(organization_id))
  with check (organization_id is not null and opsera.is_org_member(organization_id));
create policy ai_agents_org_delete on opsera.ai_agents for delete to authenticated
  using (organization_id is not null and opsera.is_org_member(organization_id));

create policy workflows_org_isolation on opsera.workflows for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy workflow_executions_org_isolation on opsera.workflow_executions for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy agent_assignments_org_isolation on opsera.agent_assignments for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy agent_executions_org_isolation on opsera.agent_executions for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));

grant select, insert, update, delete on opsera.ai_agents, opsera.workflows, opsera.workflow_executions, opsera.agent_assignments, opsera.agent_executions to authenticated;
grant all on opsera.ai_agents, opsera.workflows, opsera.workflow_executions, opsera.agent_assignments, opsera.agent_executions to service_role;
