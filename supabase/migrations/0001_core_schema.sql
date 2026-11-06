-- 0001_core_schema.sql — OrynexOpsera core: schema, enums, helpers, identity, RBAC, departments, employees
-- Design source: docs/DATABASE_DESIGN.md (schema `opsera`, org isolation via organization_members + auth.uid())

create schema if not exists opsera;
create extension if not exists pgcrypto;

-- ============ ENUMS ============
do $$ begin create type opsera.risk_level as enum ('low','medium','high','critical'); exception when duplicate_object then null; end $$;
do $$ begin create type opsera.task_status as enum ('pending','assigned','in_progress','waiting_approval','blocked','completed','failed'); exception when duplicate_object then null; end $$;
do $$ begin create type opsera.assignee_type as enum ('human','ai'); exception when duplicate_object then null; end $$;
do $$ begin create type opsera.execution_status as enum ('queued','running','waiting_approval','succeeded','failed','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type opsera.approval_status as enum ('pending','approved','rejected','expired','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type opsera.video_stage as enum ('script','storyboard','assets','animation','voice','edit','review','done'); exception when duplicate_object then null; end $$;
do $$ begin create type opsera.integration_status as enum ('not_configured','connected','error','disconnected'); exception when duplicate_object then null; end $$;
do $$ begin create type opsera.deal_stage as enum ('new','qualified','proposal','negotiation','won','lost'); exception when duplicate_object then null; end $$;
do $$ begin create type opsera.invoice_status as enum ('draft','sent','paid','overdue','cancelled','refunded'); exception when duplicate_object then null; end $$;
do $$ begin create type opsera.ticket_status as enum ('open','in_progress','waiting_customer','resolved','closed'); exception when duplicate_object then null; end $$;
do $$ begin create type opsera.priority_level as enum ('low','normal','high','urgent'); exception when duplicate_object then null; end $$;
do $$ begin create type opsera.member_status as enum ('invited','active','suspended','removed'); exception when duplicate_object then null; end $$;

-- ============ HELPERS ============
create or replace function opsera.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- Org membership check used by every RLS policy (per DATABASE_DESIGN.md).
create or replace function opsera.is_org_member(org_id uuid) returns boolean
language sql stable security definer set search_path = opsera, public as $$
  select exists (
    select 1 from opsera.organization_members m
    where m.organization_id = org_id and m.user_id = auth.uid()
      and m.status = 'active' and m.deleted_at is null
  );
$$;

-- ============ IDENTITY ============
-- Profile mirror of the Supabase auth user (never store credentials here).
create table opsera.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  avatar_url text,
  phone text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table opsera.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  industry text,
  size_band text,
  country text,
  currency text not null default 'USD',
  timezone text not null default 'UTC',
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references opsera.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ============ RBAC ============
-- Roles are global when organization_id is null (seeded defaults), org-scoped otherwise.
create table opsera.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references opsera.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index roles_global_slug_uq on opsera.roles (slug) where organization_id is null and deleted_at is null;
create unique index roles_org_slug_uq on opsera.roles (organization_id, slug) where organization_id is not null and deleted_at is null;

create table opsera.permissions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  description text,
  risk_level opsera.risk_level not null default 'low',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table opsera.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references opsera.roles(id) on delete cascade,
  permission_id uuid not null references opsera.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (role_id, permission_id)
);

create table opsera.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  user_id uuid not null references opsera.users(id) on delete cascade,
  role_id uuid references opsera.roles(id) on delete set null,
  status opsera.member_status not null default 'invited',
  invited_by uuid references opsera.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, user_id)
);
create index organization_members_user_idx on opsera.organization_members (user_id, status);
create index organization_members_org_idx on opsera.organization_members (organization_id, status);

-- ============ DEPARTMENTS & EMPLOYEES ============
create table opsera.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  parent_id uuid references opsera.departments(id) on delete set null,
  head_employee_id uuid,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, slug)
);
create index departments_org_idx on opsera.departments (organization_id);

create table opsera.employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  user_id uuid references opsera.users(id) on delete set null,
  department_id uuid references opsera.departments(id) on delete set null,
  manager_id uuid references opsera.employees(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  job_title text,
  status text not null default 'active' check (status in ('invited','active','on_leave','terminated')),
  employment_type text not null default 'full_time' check (employment_type in ('full_time','part_time','contract','intern')),
  hired_at date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index employees_org_status_idx on opsera.employees (organization_id, status);
create index employees_org_dept_idx on opsera.employees (organization_id, department_id);

alter table opsera.departments
  add constraint departments_head_employee_fk
  foreign key (head_employee_id) references opsera.employees(id) on delete set null;

-- ============ TRIGGERS ============
create trigger trg_users_updated_at before update on opsera.users for each row execute function opsera.set_updated_at();
create trigger trg_organizations_updated_at before update on opsera.organizations for each row execute function opsera.set_updated_at();
create trigger trg_roles_updated_at before update on opsera.roles for each row execute function opsera.set_updated_at();
create trigger trg_permissions_updated_at before update on opsera.permissions for each row execute function opsera.set_updated_at();
create trigger trg_organization_members_updated_at before update on opsera.organization_members for each row execute function opsera.set_updated_at();
create trigger trg_departments_updated_at before update on opsera.departments for each row execute function opsera.set_updated_at();
create trigger trg_employees_updated_at before update on opsera.employees for each row execute function opsera.set_updated_at();

-- ============ RLS ============
alter table opsera.users enable row level security;
alter table opsera.organizations enable row level security;
alter table opsera.roles enable row level security;
alter table opsera.permissions enable row level security;
alter table opsera.role_permissions enable row level security;
alter table opsera.organization_members enable row level security;
alter table opsera.departments enable row level security;
alter table opsera.employees enable row level security;

create policy users_self_read on opsera.users for select to authenticated
  using (id = auth.uid() or exists (select 1 from opsera.organization_members me
    join opsera.organization_members them on them.organization_id = me.organization_id
    where me.user_id = auth.uid() and them.user_id = opsera.users.id and me.status = 'active'));
create policy users_self_update on opsera.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy organizations_member_rw on opsera.organizations for all to authenticated
  using (opsera.is_org_member(id) or created_by = auth.uid())
  with check (opsera.is_org_member(id) or created_by = auth.uid());

-- Global roles readable by any authenticated user; org roles only by org members.
create policy roles_read on opsera.roles for select to authenticated
  using (organization_id is null or opsera.is_org_member(organization_id));
create policy roles_org_write on opsera.roles for all to authenticated
  using (organization_id is not null and opsera.is_org_member(organization_id))
  with check (organization_id is not null and opsera.is_org_member(organization_id));

create policy permissions_read on opsera.permissions for select to authenticated using (true);
create policy role_permissions_read on opsera.role_permissions for select to authenticated
  using (exists (select 1 from opsera.roles r where r.id = role_id
    and (r.organization_id is null or opsera.is_org_member(r.organization_id))));

create policy organization_members_rw on opsera.organization_members for all to authenticated
  using (opsera.is_org_member(organization_id) or user_id = auth.uid())
  with check (opsera.is_org_member(organization_id) or user_id = auth.uid());

create policy departments_org_isolation on opsera.departments for all to authenticated
  using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy employees_org_isolation on opsera.employees for all to authenticated
  using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));

grant usage on schema opsera to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema opsera to authenticated;
grant select on all tables in schema opsera to anon;
grant all on all tables in schema opsera to service_role;
