-- 0002_business_domains.sql — CRM/sales, finance, projects & unified tasks (§22), marketing, support, BI

-- ============ CRM ============
create table opsera.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  website text,
  industry text,
  status text not null default 'active' check (status in ('active','inactive','churned')),
  owner_employee_id uuid references opsera.employees(id) on delete set null,
  address jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index customers_org_status_idx on opsera.customers (organization_id, status);
create index customers_org_name_idx on opsera.customers (organization_id, name);

create table opsera.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  customer_id uuid references opsera.customers(id) on delete set null,
  name text not null,
  company text,
  email text,
  phone text,
  source text,
  status text not null default 'new' check (status in ('new','contacted','qualified','unqualified','converted')),
  score int not null default 0,
  assigned_employee_id uuid references opsera.employees(id) on delete set null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index leads_org_status_idx on opsera.leads (organization_id, status);

create table opsera.deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  customer_id uuid references opsera.customers(id) on delete set null,
  lead_id uuid references opsera.leads(id) on delete set null,
  title text not null,
  stage opsera.deal_stage not null default 'new',
  status text not null default 'open' check (status in ('open','won','lost')),
  value numeric(14,2) not null default 0,
  currency text not null default 'USD',
  probability int not null default 0 check (probability between 0 and 100),
  expected_close_date date,
  owner_employee_id uuid references opsera.employees(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index deals_org_status_idx on opsera.deals (organization_id, status);
create index deals_org_stage_idx on opsera.deals (organization_id, stage);

-- ============ FINANCE ============
create table opsera.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  customer_id uuid references opsera.customers(id) on delete set null,
  deal_id uuid references opsera.deals(id) on delete set null,
  number text not null,
  status opsera.invoice_status not null default 'draft',
  amount numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  currency text not null default 'USD',
  due_date date,
  issued_at timestamptz,
  paid_at timestamptz,
  line_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, number)
);
create index invoices_org_status_idx on opsera.invoices (organization_id, status);

create table opsera.transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  invoice_id uuid references opsera.invoices(id) on delete set null,
  customer_id uuid references opsera.customers(id) on delete set null,
  type text not null check (type in ('income','expense','transfer','refund')),
  status text not null default 'recorded' check (status in ('pending','recorded','failed','reversed')),
  amount numeric(14,2) not null,
  currency text not null default 'USD',
  category text,
  description text,
  external_ref text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index transactions_org_status_idx on opsera.transactions (organization_id, status);
create index transactions_org_occurred_idx on opsera.transactions (organization_id, occurred_at desc);

create table opsera.budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  department_id uuid references opsera.departments(id) on delete set null,
  name text not null,
  status text not null default 'active' check (status in ('draft','active','closed')),
  amount numeric(14,2) not null default 0,
  currency text not null default 'USD',
  period_start date,
  period_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index budgets_org_status_idx on opsera.budgets (organization_id, status);

create table opsera.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  budget_id uuid references opsera.budgets(id) on delete set null,
  submitted_by uuid references opsera.employees(id) on delete set null,
  category text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','reimbursed')),
  amount numeric(14,2) not null,
  currency text not null default 'USD',
  description text,
  receipt_url text,
  incurred_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index expenses_org_status_idx on opsera.expenses (organization_id, status);
create index expenses_org_category_idx on opsera.expenses (organization_id, category);

-- ============ PROJECTS & UNIFIED TASKS (§22) ============
create table opsera.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  department_id uuid references opsera.departments(id) on delete set null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('planning','active','on_hold','completed','cancelled')),
  owner_employee_id uuid references opsera.employees(id) on delete set null,
  starts_at date,
  due_at date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index projects_org_status_idx on opsera.projects (organization_id, status);

-- One task system for human AND AI employees (§22).
create table opsera.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  project_id uuid references opsera.projects(id) on delete set null,
  department_id uuid references opsera.departments(id) on delete set null,
  parent_task_id uuid references opsera.tasks(id) on delete set null,
  title text not null,
  description text,
  status opsera.task_status not null default 'pending',
  priority opsera.priority_level not null default 'normal',
  assignee_type opsera.assignee_type not null default 'human',
  assignee_employee_id uuid references opsera.employees(id) on delete set null,
  assignee_agent_id uuid,
  created_by uuid references opsera.users(id) on delete set null,
  dependencies jsonb not null default '[]'::jsonb,
  required_integrations jsonb not null default '[]'::jsonb,
  input_files jsonb not null default '[]'::jsonb,
  output_files jsonb not null default '[]'::jsonb,
  approval_required boolean not null default false,
  due_at timestamptz,
  completed_at timestamptz,
  execution_log jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint tasks_assignee_matches_type check (
    (assignee_type = 'human' and assignee_agent_id is null) or
    (assignee_type = 'ai' and assignee_employee_id is null)
  )
);
create index tasks_org_status_idx on opsera.tasks (organization_id, status);
create index tasks_org_project_idx on opsera.tasks (organization_id, project_id);
create index tasks_assignee_employee_idx on opsera.tasks (assignee_employee_id, status) where assignee_employee_id is not null;

-- ============ MARKETING ============
create table opsera.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  department_id uuid references opsera.departments(id) on delete set null,
  name text not null,
  channel text,
  status text not null default 'draft' check (status in ('draft','scheduled','active','paused','completed','cancelled')),
  objective text,
  budget numeric(14,2),
  currency text not null default 'USD',
  owner_employee_id uuid references opsera.employees(id) on delete set null,
  starts_at timestamptz,
  ends_at timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index campaigns_org_status_idx on opsera.campaigns (organization_id, status);

-- ============ SUPPORT ============
create table opsera.support_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  customer_id uuid references opsera.customers(id) on delete set null,
  subject text not null,
  description text,
  channel text not null default 'email' check (channel in ('email','whatsapp','voice','chat','slack','teams','other')),
  status opsera.ticket_status not null default 'open',
  priority opsera.priority_level not null default 'normal',
  assigned_employee_id uuid references opsera.employees(id) on delete set null,
  assigned_agent_id uuid,
  satisfaction_score int check (satisfaction_score between 1 and 5),
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index support_tickets_org_status_idx on opsera.support_tickets (organization_id, status);
create index support_tickets_org_priority_idx on opsera.support_tickets (organization_id, priority);

-- ============ NOTIFICATIONS & REPORTS ============
create table opsera.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  user_id uuid not null references opsera.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  status text not null default 'unread' check (status in ('unread','read','archived')),
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index notifications_org_status_idx on opsera.notifications (organization_id, status);
create index notifications_user_status_idx on opsera.notifications (user_id, status);

create table opsera.business_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  title text not null,
  report_type text not null,
  status text not null default 'draft' check (status in ('draft','generating','ready','failed')),
  period_start date,
  period_end date,
  summary text,
  data jsonb not null default '{}'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  generated_by_agent_id uuid,
  generated_by_user_id uuid references opsera.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index business_reports_org_status_idx on opsera.business_reports (organization_id, status);
create index business_reports_org_type_idx on opsera.business_reports (organization_id, report_type);

-- ============ TRIGGERS ============
create trigger trg_customers_updated_at before update on opsera.customers for each row execute function opsera.set_updated_at();
create trigger trg_leads_updated_at before update on opsera.leads for each row execute function opsera.set_updated_at();
create trigger trg_deals_updated_at before update on opsera.deals for each row execute function opsera.set_updated_at();
create trigger trg_invoices_updated_at before update on opsera.invoices for each row execute function opsera.set_updated_at();
create trigger trg_transactions_updated_at before update on opsera.transactions for each row execute function opsera.set_updated_at();
create trigger trg_budgets_updated_at before update on opsera.budgets for each row execute function opsera.set_updated_at();
create trigger trg_expenses_updated_at before update on opsera.expenses for each row execute function opsera.set_updated_at();
create trigger trg_projects_updated_at before update on opsera.projects for each row execute function opsera.set_updated_at();
create trigger trg_tasks_updated_at before update on opsera.tasks for each row execute function opsera.set_updated_at();
create trigger trg_campaigns_updated_at before update on opsera.campaigns for each row execute function opsera.set_updated_at();
create trigger trg_support_tickets_updated_at before update on opsera.support_tickets for each row execute function opsera.set_updated_at();
create trigger trg_notifications_updated_at before update on opsera.notifications for each row execute function opsera.set_updated_at();
create trigger trg_business_reports_updated_at before update on opsera.business_reports for each row execute function opsera.set_updated_at();

-- ============ RLS (org isolation on every table) ============
alter table opsera.customers enable row level security;
alter table opsera.leads enable row level security;
alter table opsera.deals enable row level security;
alter table opsera.invoices enable row level security;
alter table opsera.transactions enable row level security;
alter table opsera.budgets enable row level security;
alter table opsera.expenses enable row level security;
alter table opsera.projects enable row level security;
alter table opsera.tasks enable row level security;
alter table opsera.campaigns enable row level security;
alter table opsera.support_tickets enable row level security;
alter table opsera.notifications enable row level security;
alter table opsera.business_reports enable row level security;

create policy customers_org_isolation on opsera.customers for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy leads_org_isolation on opsera.leads for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy deals_org_isolation on opsera.deals for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy invoices_org_isolation on opsera.invoices for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy transactions_org_isolation on opsera.transactions for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy budgets_org_isolation on opsera.budgets for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy expenses_org_isolation on opsera.expenses for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy projects_org_isolation on opsera.projects for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy tasks_org_isolation on opsera.tasks for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy campaigns_org_isolation on opsera.campaigns for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy support_tickets_org_isolation on opsera.support_tickets for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy notifications_org_isolation on opsera.notifications for all to authenticated using (opsera.is_org_member(organization_id) and user_id = auth.uid()) with check (opsera.is_org_member(organization_id) and user_id = auth.uid());
create policy business_reports_org_isolation on opsera.business_reports for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));

grant select, insert, update, delete on opsera.customers, opsera.leads, opsera.deals, opsera.invoices, opsera.transactions, opsera.budgets, opsera.expenses, opsera.projects, opsera.tasks, opsera.campaigns, opsera.support_tickets, opsera.notifications, opsera.business_reports to authenticated;
grant all on opsera.customers, opsera.leads, opsera.deals, opsera.invoices, opsera.transactions, opsera.budgets, opsera.expenses, opsera.projects, opsera.tasks, opsera.campaigns, opsera.support_tickets, opsera.notifications, opsera.business_reports to service_role;
