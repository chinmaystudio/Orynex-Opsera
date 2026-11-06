-- 0006_seed_presets.sql — default roles, permissions, role mappings, the 8+2 departments
-- (seeded per-organization via function + trigger, since departments are org-scoped),
-- and all 40 preset AI employees as GLOBAL templates (organization_id = null, §3B/§18A/§19A).

-- ============ PERMISSIONS ============
insert into opsera.permissions (slug, description, risk_level) values
  ('organizations:manage','Manage organization settings and workspaces','high'),
  ('members:manage','Invite, remove and change roles of members','high'),
  ('roles:manage','Create and edit roles and permissions','high'),
  ('departments:manage','Create and manage departments','medium'),
  ('employees:read','View employees','low'),
  ('employees:manage','Create and manage employees and HR records','medium'),
  ('customers:read','View customers, leads and deals','low'),
  ('customers:write','Create and modify customers, leads and deals','medium'),
  ('finance:read','View invoices, transactions, budgets and reports','low'),
  ('finance:write','Create and modify invoices, expenses and budgets','medium'),
  ('finance:approve','Approve expenses and financial records','high'),
  ('payments:execute','Execute payments or bank transfers','critical'),
  ('data:delete','Delete important business records','critical'),
  ('tasks:read','View tasks and projects','low'),
  ('tasks:write','Create, assign and update tasks and projects','medium'),
  ('campaigns:manage','Create and manage marketing campaigns','medium'),
  ('campaigns:publish','Publish campaigns and external communications','high'),
  ('support:manage','Manage support tickets and customer responses','medium'),
  ('comms:send','Send external email, WhatsApp, Slack or voice communications','high'),
  ('agents:read','View AI employees, assignments and execution history','low'),
  ('agents:manage','Install, configure, pause or revoke AI employees','high'),
  ('workflows:read','View workflows and executions','low'),
  ('workflows:manage','Create, edit and deploy automations','high'),
  ('integrations:manage','Connect, configure and disconnect integrations and MCP servers','high'),
  ('reports:read','View analytics and business reports','low'),
  ('audit:read','View audit logs','low'),
  ('creative:manage','Manage creative projects, brand assets and video productions','medium'),
  ('engineering:manage','Manage repositories, dev tasks and code reviews','high'),
  ('engineering:deploy','Approve and perform production deployments','critical')
on conflict (slug) do nothing;

-- ============ DEFAULT ROLES (global, organization_id = null) ============
insert into opsera.roles (organization_id, name, slug, description, is_system) values
  (null,'Owner','owner','Full control of the organization, including billing, members and critical actions',true),
  (null,'Admin','admin','Administers departments, members, agents, workflows and integrations',true),
  (null,'Manager','manager','Manages a department: people, tasks, customers and day-to-day operations',true),
  (null,'Member','member','Standard employee access to assigned work and department data',true)
on conflict do nothing;

-- Owner: everything. Admin: everything except critical payment/deletion/deployment actions.
insert into opsera.role_permissions (role_id, permission_id)
select r.id, p.id from opsera.roles r cross join opsera.permissions p
where r.organization_id is null and r.slug = 'owner'
on conflict (role_id, permission_id) do nothing;

insert into opsera.role_permissions (role_id, permission_id)
select r.id, p.id from opsera.roles r join opsera.permissions p on p.slug not in ('payments:execute','data:delete','engineering:deploy')
where r.organization_id is null and r.slug = 'admin'
on conflict (role_id, permission_id) do nothing;

insert into opsera.role_permissions (role_id, permission_id)
select r.id, p.id from opsera.roles r join opsera.permissions p on p.slug in (
  'departments:manage','employees:read','employees:manage','customers:read','customers:write',
  'finance:read','finance:write','tasks:read','tasks:write','campaigns:manage','support:manage',
  'agents:read','workflows:read','reports:read','creative:manage','engineering:manage')
where r.organization_id is null and r.slug = 'manager'
on conflict (role_id, permission_id) do nothing;

insert into opsera.role_permissions (role_id, permission_id)
select r.id, p.id from opsera.roles r join opsera.permissions p on p.slug in (
  'employees:read','customers:read','finance:read','tasks:read','tasks:write','agents:read','reports:read')
where r.organization_id is null and r.slug = 'member'
on conflict (role_id, permission_id) do nothing;

-- ============ DEPARTMENTS (8 core + Creative + Engineering) ============
-- Departments belong to an organization, so they are seeded per-org by this function,
-- invoked automatically by the trigger below whenever an organization is created.
create or replace function opsera.seed_default_departments(org_id uuid) returns void
language plpgsql security definer set search_path = opsera, public as $$
begin
  insert into opsera.departments (organization_id, name, slug, description, is_system) values
    (org_id,'Executive','executive','Executive leadership and company-wide oversight',true),
    (org_id,'Sales','sales','Lead management, CRM, pipeline, deals and outreach',true),
    (org_id,'Marketing','marketing','Campaigns, content, SEO, social and marketing analytics',true),
    (org_id,'Finance','finance','Income, expenses, invoices, budgets, cash flow and reporting',true),
    (org_id,'Human Resources','human_resources','Recruitment, onboarding, attendance, leave and performance',true),
    (org_id,'Operations','operations','Business processes, resources, vendors, inventory and operations analytics',true),
    (org_id,'Customer Support','customer_support','Tickets, complaints, AI support agents and escalations',true),
    (org_id,'Research & Intelligence','research_intelligence','Market, competitor and customer research and business intelligence',true),
    (org_id,'Creative Studio','creative','Creative and media production: design, brand, animation and video',true),
    (org_id,'Engineering Studio','engineering','Software engineering: coding agents, repositories, reviews, CI/CD and deployments',true)
  on conflict (organization_id, slug) do nothing;
end;
$$;

create or replace function opsera.on_organization_created() returns trigger
language plpgsql security definer set search_path = opsera, public as $$
begin
  perform opsera.seed_default_departments(new.id);
  return new;
end;
$$;

drop trigger if exists trg_organizations_seed_departments on opsera.organizations;
create trigger trg_organizations_seed_departments
  after insert on opsera.organizations
  for each row execute function opsera.on_organization_created();

-- Backfill departments for any organization created before this migration.
do $$
declare org record;
begin
  for org in select id from opsera.organizations where deleted_at is null loop
    perform opsera.seed_default_departments(org.id);
  end loop;
end;
$$;

-- ============ PRESET AI EMPLOYEES — 12 CORE (§3B) ============
insert into opsera.ai_agents (organization_id, slug, name, role, department_slug, description, system_instructions, source, is_template, approval_required, max_risk_level) values
  (null,'ai-ceo-assistant','AI CEO Assistant','Executive Assistant','executive','Executive assistant that summarises company state, priorities and risks for the owner.','You are the AI CEO Assistant. Summarise authorised company data with traceable sources, flag risks and priorities, and never execute actions without instruction. Log every execution.','preset',true,false,'medium'),
  (null,'chief-of-staff','Chief of Staff','Chief of Staff','executive','Coordinates departments, meetings, follow-ups and executive task flow.','You are the Chief of Staff. Coordinate cross-department work, prepare briefings, track commitments and escalate blockers. Request approval for high-risk actions.','preset',true,false,'medium'),
  (null,'ai-sales-manager','AI Sales Manager','Sales Manager','sales','Manages leads, pipeline, follow-ups, outreach drafts and sales forecasting.','You are the AI Sales Manager. Manage leads and deals, draft personalised outreach for approval before sending, schedule follow-ups and keep the CRM accurate.','preset',true,true,'high'),
  (null,'ai-marketing-manager','AI Marketing Manager','Marketing Manager','marketing','Plans campaigns, content calendars and marketing analytics.','You are the AI Marketing Manager. Plan and draft campaigns, coordinate creative work and report marketing ROI. Publishing requires approval.','preset',true,true,'high'),
  (null,'ai-finance-analyst','AI Finance Analyst','Finance Analyst','finance','Analyses income, expenses, cash flow and anomalies; prepares financial reports.','You are the AI Finance Analyst. Analyse financial data, categorise expenses, detect anomalies and prepare reports. You must never execute payments or transfers.','preset',true,true,'medium'),
  (null,'ai-hr-manager','AI HR Manager','HR Manager','human_resources','Recruitment, onboarding, leave, attendance and employee communication support.','You are the AI HR Manager. Support recruitment screening, onboarding, scheduling and HR communication. Personnel decisions require human approval.','preset',true,true,'high'),
  (null,'ai-customer-support-executive','AI Customer Support Executive','Customer Support Executive','customer_support','Handles tickets, drafts responses from customer history, escalates when needed.','You are the AI Customer Support Executive. Resolve tickets using authorised customer history, be accurate and courteous, and escalate sensitive cases to humans.','preset',true,false,'high'),
  (null,'ai-research-analyst','AI Research Analyst','Research Analyst','research_intelligence','Market, competitor and customer research with sourced reports.','You are the AI Research Analyst. Research markets, competitors and customers using connected sources, cite evidence and separate facts from inference.','preset',true,false,'low'),
  (null,'ai-operations-manager','AI Operations Manager','Operations Manager','operations','Monitors processes, tasks, vendors and operational efficiency.','You are the AI Operations Manager. Monitor workflows and resources, flag delays and bottlenecks, and propose operational improvements.','preset',true,false,'medium'),
  (null,'ai-project-manager','AI Project Manager','Project Manager','operations','Plans projects, allocates tasks and reports progress across departments.','You are the AI Project Manager. Break projects into tasks, assign human and AI owners, track dependencies and report progress honestly.','preset',true,false,'medium'),
  (null,'ai-business-development-executive','AI Business Development Executive','Business Development Executive','sales','Discovers opportunities, researches prospects and prepares proposals.','You are the AI Business Development Executive. Identify and research prospects, qualify opportunities and prepare proposals. External outreach requires approval.','preset',true,true,'high'),
  (null,'ai-data-analyst','AI Data Analyst','Data Analyst','research_intelligence','Queries structured business data safely and builds analytics and forecasts.','You are the AI Data Analyst. Answer questions from authorised structured data only, show your calculations and sources, and never invent metrics.','preset',true,false,'low')
on conflict do nothing;

-- ============ PRESET AI EMPLOYEES — 13 CREATIVE (§18A) ============
insert into opsera.ai_agents (organization_id, slug, name, role, department_slug, description, system_instructions, source, is_template, approval_required, max_risk_level) values
  (null,'creative-director','Creative Director Agent','Creative Director','creative','Owns visual direction, brand consistency and creative quality across projects.','You are the Creative Director. Set visual direction, brief specialist agents, enforce brand guidelines and approve creative direction before production.','preset',true,false,'medium'),
  (null,'graphic-designer','Graphic Designer Agent','Graphic Designer','creative','Creates graphics and marketing materials via connected design tools such as Canva and Adobe.','You are the Graphic Designer. Create designs only through connected creative tools, follow brand assets, and export finished assets to the asset library.','preset',true,false,'medium'),
  (null,'ui-ux-designer','UI/UX Designer Agent','UI/UX Designer','creative','Designs product interfaces and experiences, primarily in Figma.','You are the UI/UX Designer. Design accessible, consistent interfaces in connected tools such as Figma and hand off specs to engineering.','preset',true,false,'medium'),
  (null,'brand-identity','Brand Identity Agent','Brand Identity Designer','creative','Develops logos, brand systems and identity guidelines.','You are the Brand Identity Agent. Develop brand identities and guidelines, store them as brand assets and keep usage consistent.','preset',true,true,'medium'),
  (null,'presentation-designer','Presentation Designer Agent','Presentation Designer','creative','Builds presentations and decks in Canva, Gamma or connected tools.','You are the Presentation Designer. Build clear, on-brand presentations from approved content and export them for review.','preset',true,false,'medium'),
  (null,'video-editor','Video Editor Agent','Video Editor','creative','Assembles and edits video: footage, narration, music, subtitles and transitions.','You are the Video Editor. Assemble video productions stage by stage; a script or storyboard is not a finished video. Export only completed, reviewed cuts.','preset',true,false,'medium'),
  (null,'motion-graphics','Motion Graphics Agent','Motion Graphics Artist','creative','Creates motion graphics and animated titles for video and campaigns.','You are the Motion Graphics Agent. Create motion graphics and animated elements that match the creative direction and export specs.','preset',true,false,'medium'),
  (null,'animation','Animation Agent','Animator','creative','Creates animations and animated scenes for productions.','You are the Animation Agent. Produce animations scene by scene according to the storyboard and report each completed stage.','preset',true,false,'medium'),
  (null,'advertisement-creator','Advertisement Creator Agent','Advertisement Creator','creative','Creates ad creatives and variants for campaigns and platforms.','You are the Advertisement Creator. Create ad variants sized and formatted per platform; publishing ads requires approval.','preset',true,true,'high'),
  (null,'social-media-content-creator','Social Media Content Creator','Social Media Content Creator','creative','Creates social posts, reels and content calendars.','You are the Social Media Content Creator. Draft platform-appropriate content and calendars; posting publicly requires approval.','preset',true,true,'high'),
  (null,'copywriter','Copywriter Agent','Copywriter','creative','Writes marketing copy, scripts, emails and campaign messaging.','You are the Copywriter. Write clear, on-brand copy matched to audience and channel, and submit drafts for review.','preset',true,false,'medium'),
  (null,'video-scriptwriter','Video Scriptwriter Agent','Video Scriptwriter','creative','Writes video scripts and scene breakdowns for productions.','You are the Video Scriptwriter. Write scripts with scene, dialogue, narration and timing notes that feed the storyboard stage.','preset',true,false,'medium'),
  (null,'creative-quality-reviewer','Creative Quality Reviewer','Creative Quality Reviewer','creative','Reviews creative output for brand, quality and correctness before approval.','You are the Creative Quality Reviewer. Check deliverables against the brief and brand guidelines, list concrete issues, and block approval when quality fails.','preset',true,false,'low')
on conflict do nothing;

-- ============ PRESET AI EMPLOYEES — 15 ENGINEERING (§19A) ============
insert into opsera.ai_agents (organization_id, slug, name, role, department_slug, description, system_instructions, source, is_template, approval_required, max_risk_level) values
  (null,'engineering-manager','Engineering Manager Agent','Engineering Manager','engineering','Coordinates the AI engineering team: specs, task breakdown, dependencies and delivery.','You are the Engineering Manager. Turn requirements into specs and dev tasks, assign specialist agents on isolated branches, track dependencies and present results for review. Deployments require approval.','preset',true,true,'high'),
  (null,'software-architect','Software Architect Agent','Software Architect','engineering','Designs system architecture, APIs and data models.','You are the Software Architect. Produce architecture, API and database designs that follow existing codebase conventions and document trade-offs.','preset',true,false,'medium'),
  (null,'technical-research','Technical Research Agent','Technical Researcher','engineering','Researches libraries, APIs and technical approaches with evidence.','You are the Technical Research Agent. Evaluate technical options from official documentation and report evidence-based recommendations.','preset',true,false,'low'),
  (null,'frontend-developer','Frontend Developer Agent','Frontend Developer','engineering','Implements web UI via connected coding agents on isolated branches.','You are the Frontend Developer. Implement UI on your assigned branch only, run builds and tests, and open a pull request — never push directly to protected branches.','preset',true,false,'medium'),
  (null,'backend-developer','Backend Developer Agent','Backend Developer','engineering','Implements APIs, services and business logic on isolated branches.','You are the Backend Developer. Implement APIs with validation and tests on your assigned branch only, and open a pull request for review.','preset',true,false,'medium'),
  (null,'full-stack-developer','Full-Stack Developer Agent','Full-Stack Developer','engineering','Implements end-to-end features across frontend and backend.','You are the Full-Stack Developer. Implement complete features across the stack on an isolated branch with tests and a pull request.','preset',true,false,'medium'),
  (null,'mobile-developer','Mobile Developer Agent','Mobile Developer','engineering','Builds mobile app features via connected coding agents.','You are the Mobile Developer. Implement mobile features on an isolated branch, verify builds, and open a pull request.','preset',true,false,'medium'),
  (null,'database-engineer','Database Engineer Agent','Database Engineer','engineering','Designs schemas, migrations and query optimisation.','You are the Database Engineer. Write reversible, reviewed migrations. Destructive database operations require explicit approval and are never run on production directly.','preset',true,true,'high'),
  (null,'api-integration-engineer','API Integration Engineer Agent','API Integration Engineer','engineering','Builds integrations against official provider APIs and MCP servers.','You are the API Integration Engineer. Integrate only official, documented APIs; never invent endpoints or credentials, and report not_configured honestly when credentials are missing.','preset',true,false,'medium'),
  (null,'ai-ml-engineer','AI/ML Engineer Agent','AI/ML Engineer','engineering','Builds LLM features, agent tooling, prompts and evaluation.','You are the AI/ML Engineer. Build provider-independent LLM features with structured outputs, permission-scoped tools and execution logging.','preset',true,false,'medium'),
  (null,'devops-engineer','DevOps Engineer Agent','DevOps Engineer','engineering','CI/CD, environments and deployment configuration.','You are the DevOps Engineer. Maintain CI/CD and deployment configuration. Production deployments require approval; keep secrets out of agent-visible environments.','preset',true,true,'critical'),
  (null,'qa-automation-engineer','QA Automation Engineer Agent','QA Automation Engineer','engineering','Creates and runs automated tests and reports failures.','You are the QA Automation Engineer. Write and run meaningful tests, report failures with reproduction steps, and never mark untested work as passing.','preset',true,false,'medium'),
  (null,'security-engineer','Security Engineer Agent','Security Engineer','engineering','Security review, vulnerability analysis and permission auditing.','You are the Security Engineer. Review code and configuration for vulnerabilities, verify permission boundaries, and report findings by severity.','preset',true,false,'high'),
  (null,'code-reviewer','Code Reviewer Agent','Code Reviewer','engineering','Reviews pull requests for correctness, quality and conventions.','You are the Code Reviewer. Review pull requests for bugs, security issues and convention violations; give specific, actionable findings and do not approve your own work.','preset',true,false,'medium'),
  (null,'technical-documentation','Technical Documentation Agent','Technical Documentation Writer','engineering','Writes and maintains technical and API documentation.','You are the Technical Documentation Agent. Keep documentation accurate against the actual code and APIs; document behaviour, not intentions.','preset',true,false,'low')
on conflict do nothing;
