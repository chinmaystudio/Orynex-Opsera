export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type AgentCategory = 'core' | 'creative' | 'engineering'

export interface Agent {
  id?: string
  slug?: string
  name: string
  role: string
  description: string
  department: string
  category: AgentCategory
  status?: string
  llm?: string
  tools?: string[]
}

export interface Overview {
  organization_id?: string
  total_revenue?: number
  total_expenses?: number
  profit?: number
  active_projects?: number
  employees?: number
  ai_agents?: number
  customers?: number
  open_leads?: number
  open_deals?: number
  pending_approvals?: number
  active_automations?: number
  open_tasks?: number
  open_tickets?: number
  [key: string]: unknown
}

export interface Department {
  id?: string
  name: string
  slug?: string
  description?: string
  employee_count?: number
  agent_count?: number
  [key: string]: unknown
}

export type TaskStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'waiting_approval'
  | 'blocked'
  | 'completed'
  | 'failed'

export interface BusinessTask {
  id?: string
  title: string
  description?: string
  department?: string
  assignee_type?: 'human' | 'agent'
  assignee_name?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status: TaskStatus | string
  due_date?: string
  created_at?: string
  [key: string]: unknown
}

export interface ApprovalRequest {
  id?: string
  title: string
  description?: string
  risk_level: RiskLevel | string
  status: 'pending' | 'approved' | 'rejected' | string
  requested_by?: string
  action_type?: string
  created_at?: string
  [key: string]: unknown
}

export interface CommandPlanStep {
  step?: number
  action?: string
  tool?: string
  description?: string
  risk_level?: string
  requires_approval?: boolean
  [key: string]: unknown
}

export interface CommandResponse {
  command: string
  summary?: string
  plan: CommandPlanStep[]
  requires_approval?: boolean
  executed?: boolean
  notes?: string
  [key: string]: unknown
}

export interface Organization {
  id: string
  name: string
  slug?: string
  owner_email?: string
  plan?: string
  [key: string]: unknown
}

export type LeadStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'won'
  | 'lost'

export interface Lead {
  id?: string
  organization_id?: string
  name: string
  company?: string
  email?: string
  source?: string
  stage: LeadStage | string
  value?: number
  customer_id?: string
  assigned_to?: string
  created_at?: string
  [key: string]: unknown
}

export interface Customer {
  id?: string
  organization_id?: string
  name: string
  email?: string
  phone?: string
  company?: string
  industry?: string
  status?: string
  notes?: string
  created_at?: string
  [key: string]: unknown
}

export interface Employee {
  id?: string
  organization_id?: string
  full_name: string
  email?: string
  department_id?: string
  role?: string
  job_title?: string
  status?: string
  created_at?: string
  [key: string]: unknown
}

/** Shape returned by GET /api/v1/overview (backend routers/overview.py). */
export interface OverviewDetail {
  organization_id?: string | null
  generated_at?: string
  totals?: {
    departments?: number
    employees?: number
    customers?: number
    leads?: number
    tasks_total?: number
    tasks_open?: number
    agents_installed?: number
    agents_active?: number
    pending_approvals?: number
    [key: string]: unknown
  }
  tasks_by_status?: Record<string, number>
  sales_pipeline?: Record<string, { count: number; value: number }>
  sales_pipeline_total_value?: number
  finance?: {
    revenue: number
    expenses: number
    profit: number
    /** Backend's own explanation of where these figures come from. */
    source?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface Integration {
  name: string
  category: string
  route: string
  status: 'not_configured'
  phase: string
}
