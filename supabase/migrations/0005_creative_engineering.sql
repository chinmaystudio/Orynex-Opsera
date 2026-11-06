-- 0005_creative_engineering.sql — Creative Studio (§18) and Engineering Studio (§19)

-- ============ CREATIVE STUDIO ============
create table opsera.creative_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  project_id uuid references opsera.projects(id) on delete set null,
  campaign_id uuid references opsera.campaigns(id) on delete set null,
  name text not null,
  type text not null default 'design' check (type in ('design','presentation','video','animation','branding','advertisement','social_content','other')),
  status text not null default 'draft' check (status in ('draft','in_progress','in_review','approved','completed','cancelled')),
  brief text,
  creative_lead_agent_id uuid references opsera.ai_agents(id) on delete set null,
  owner_employee_id uuid references opsera.employees(id) on delete set null,
  tools_used jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index creative_projects_org_status_idx on opsera.creative_projects (organization_id, status);
create index creative_projects_org_type_idx on opsera.creative_projects (organization_id, type);

create table opsera.brand_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  creative_project_id uuid references opsera.creative_projects(id) on delete set null,
  name text not null,
  asset_type text not null check (asset_type in ('logo','image','icon','font','template','guideline','audio','video','other')),
  status text not null default 'draft' check (status in ('draft','in_review','approved','archived')),
  storage_path text,
  file_url text,
  mime_type text,
  version int not null default 1,
  is_brand_guideline boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references opsera.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index brand_assets_org_status_idx on opsera.brand_assets (organization_id, status);
create index brand_assets_org_type_idx on opsera.brand_assets (organization_id, asset_type);

-- Stage-tracked pipeline (§18C): a script/storyboard is NEVER a completed video —
-- a production is only 'done' when current_stage reaches 'done' after review.
create table opsera.video_productions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  creative_project_id uuid references opsera.creative_projects(id) on delete set null,
  campaign_id uuid references opsera.campaigns(id) on delete set null,
  title text not null,
  status text not null default 'in_progress' check (status in ('in_progress','in_review','approved','completed','failed','cancelled')),
  current_stage opsera.video_stage not null default 'script',
  target_duration_seconds int,
  aspect_ratio text not null default '16:9',
  script jsonb not null default '{}'::jsonb,
  storyboard jsonb not null default '[]'::jsonb,
  stage_history jsonb not null default '[]'::jsonb,
  voiceover jsonb not null default '{}'::jsonb,
  subtitles jsonb not null default '{}'::jsonb,
  output_url text,
  output_format text,
  output_resolution text,
  assigned_agent_id uuid references opsera.ai_agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index video_productions_org_status_idx on opsera.video_productions (organization_id, status);
create index video_productions_org_stage_idx on opsera.video_productions (organization_id, current_stage);

-- ============ ENGINEERING STUDIO ============
create table opsera.repositories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  connected_account_id uuid references opsera.connected_accounts(id) on delete set null,
  project_id uuid references opsera.projects(id) on delete set null,
  provider text not null check (provider in ('github','gitlab','bitbucket')),
  name text not null,
  full_name text not null,
  url text,
  default_branch text not null default 'main',
  status text not null default 'active' check (status in ('active','archived','error')),
  is_private boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, provider, full_name)
);
create index repositories_org_status_idx on opsera.repositories (organization_id, status);

create table opsera.dev_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  repository_id uuid references opsera.repositories(id) on delete set null,
  task_id uuid references opsera.tasks(id) on delete set null,
  project_id uuid references opsera.projects(id) on delete set null,
  title text not null,
  description text,
  status opsera.task_status not null default 'pending',
  coding_agent_provider text check (coding_agent_provider in ('codex','claude_code','copilot','cursor','other')),
  assigned_agent_id uuid references opsera.ai_agents(id) on delete set null,
  -- Branch/worktree isolation (§19E): agents never share a working directory.
  branch_name text,
  worktree_ref text,
  pull_request_url text,
  pull_request_number int,
  ci_status text check (ci_status in ('unknown','pending','passing','failing')),
  depends_on jsonb not null default '[]'::jsonb,
  execution_log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index dev_tasks_org_status_idx on opsera.dev_tasks (organization_id, status);
create index dev_tasks_repo_idx on opsera.dev_tasks (repository_id, status);

create table opsera.code_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references opsera.organizations(id) on delete cascade,
  repository_id uuid references opsera.repositories(id) on delete set null,
  dev_task_id uuid references opsera.dev_tasks(id) on delete set null,
  pull_request_url text,
  pull_request_number int,
  title text,
  status text not null default 'pending' check (status in ('pending','in_progress','approved','changes_requested','rejected','merged')),
  reviewer_employee_id uuid references opsera.employees(id) on delete set null,
  reviewer_agent_id uuid references opsera.ai_agents(id) on delete set null,
  security_findings jsonb not null default '[]'::jsonb,
  findings jsonb not null default '[]'::jsonb,
  summary text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index code_reviews_org_status_idx on opsera.code_reviews (organization_id, status);
create index code_reviews_repo_idx on opsera.code_reviews (repository_id, status);

-- ============ TRIGGERS ============
create trigger trg_creative_projects_updated_at before update on opsera.creative_projects for each row execute function opsera.set_updated_at();
create trigger trg_brand_assets_updated_at before update on opsera.brand_assets for each row execute function opsera.set_updated_at();
create trigger trg_video_productions_updated_at before update on opsera.video_productions for each row execute function opsera.set_updated_at();
create trigger trg_repositories_updated_at before update on opsera.repositories for each row execute function opsera.set_updated_at();
create trigger trg_dev_tasks_updated_at before update on opsera.dev_tasks for each row execute function opsera.set_updated_at();
create trigger trg_code_reviews_updated_at before update on opsera.code_reviews for each row execute function opsera.set_updated_at();

-- ============ RLS ============
alter table opsera.creative_projects enable row level security;
alter table opsera.brand_assets enable row level security;
alter table opsera.video_productions enable row level security;
alter table opsera.repositories enable row level security;
alter table opsera.dev_tasks enable row level security;
alter table opsera.code_reviews enable row level security;

create policy creative_projects_org_isolation on opsera.creative_projects for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy brand_assets_org_isolation on opsera.brand_assets for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy video_productions_org_isolation on opsera.video_productions for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy repositories_org_isolation on opsera.repositories for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy dev_tasks_org_isolation on opsera.dev_tasks for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));
create policy code_reviews_org_isolation on opsera.code_reviews for all to authenticated using (opsera.is_org_member(organization_id)) with check (opsera.is_org_member(organization_id));

grant select, insert, update, delete on opsera.creative_projects, opsera.brand_assets, opsera.video_productions, opsera.repositories, opsera.dev_tasks, opsera.code_reviews to authenticated;
grant all on opsera.creative_projects, opsera.brand_assets, opsera.video_productions, opsera.repositories, opsera.dev_tasks, opsera.code_reviews to service_role;
