import type {
  Agent,
  ApprovalRequest,
  BusinessTask,
  CommandResponse,
  Customer,
  Department,
  Employee,
  Lead,
  Organization,
  Overview,
  OverviewDetail,
} from './types'

const API_BASE: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:8000'

export const apiBaseUrl = API_BASE

/** Thrown when the backend cannot be reached at all (offline / not running). */
export class BackendOfflineError extends Error {
  constructor() {
    super('Backend offline')
    this.name = 'BackendOfflineError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  } catch {
    throw new BackendOfflineError()
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }
  return (await res.json()) as T
}

/** Backend list endpoints may return a bare array or an envelope object. */
function asList<T>(data: unknown, keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    for (const key of keys) {
      const value = (data as Record<string, unknown>)[key]
      if (Array.isArray(value)) return value as T[]
    }
  }
  return []
}

export const api = {
  async getOverview(): Promise<Overview> {
    return request<Overview>('/api/v1/overview')
  },

  async getAgents(): Promise<Agent[]> {
    // The backend returns an envelope { presets, installed }. This method
    // returns the INSTALLED agents (organization-scoped ai_agents records);
    // the preset registry lives in lib/presets.ts.
    const data = await request<unknown>('/api/v1/agents')
    return asList<Agent>(data, ['installed', 'agents', 'items', 'results'])
  },

  async getDepartments(): Promise<Department[]> {
    const data = await request<unknown>('/api/v1/departments')
    return asList<Department>(data, ['departments', 'items', 'results'])
  },

  async getTasks(): Promise<BusinessTask[]> {
    const data = await request<unknown>('/api/v1/tasks')
    return asList<BusinessTask>(data, ['tasks', 'items', 'results'])
  },

  async createTask(task: {
    title: string
    description?: string
    department?: string
    priority?: string
    assignee_type?: string
  }): Promise<BusinessTask> {
    return request<BusinessTask>('/api/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    })
  },

  async getApprovals(): Promise<ApprovalRequest[]> {
    const data = await request<unknown>('/api/v1/approvals')
    return asList<ApprovalRequest>(data, ['approvals', 'items', 'results'])
  },

  async decideApproval(
    id: string,
    decision: 'approved' | 'rejected',
  ): Promise<ApprovalRequest> {
    return request<ApprovalRequest>(`/api/v1/approvals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: decision }),
    })
  },

  /** Full nested overview payload (totals / pipeline / finance + source note). */
  async getOverviewDetail(): Promise<OverviewDetail> {
    return request<OverviewDetail>('/api/v1/overview')
  },

  async getOrganizations(): Promise<Organization[]> {
    const data = await request<unknown>('/api/v1/organizations')
    return asList<Organization>(data, ['organizations', 'items', 'results'])
  },

  async getLeads(): Promise<Lead[]> {
    const data = await request<unknown>('/api/v1/leads')
    return asList<Lead>(data, ['leads', 'items', 'results'])
  },

  async createLead(lead: {
    organization_id: string
    name: string
    company?: string
    email?: string
    source?: string
    stage?: string
    value?: number
  }): Promise<Lead> {
    return request<Lead>('/api/v1/leads', {
      method: 'POST',
      body: JSON.stringify(lead),
    })
  },

  async getCustomers(): Promise<Customer[]> {
    const data = await request<unknown>('/api/v1/customers')
    return asList<Customer>(data, ['customers', 'items', 'results'])
  },

  async getEmployees(): Promise<Employee[]> {
    const data = await request<unknown>('/api/v1/employees')
    return asList<Employee>(data, ['employees', 'items', 'results'])
  },

  async postCommand(command: string): Promise<CommandResponse> {
    return request<CommandResponse>('/api/v1/command', {
      method: 'POST',
      body: JSON.stringify({ command }),
    })
  },
}
