import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import CommandCenter from './pages/CommandCenter'
import AIWorkforce from './pages/AIWorkforce'
import Departments from './pages/Departments'
import Tasks from './pages/Tasks'
import Approvals from './pages/Approvals'
import Integrations from './pages/Integrations'
import PlaceholderPage from './pages/Placeholder'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<CommandCenter />} />
          <Route path="ai-workforce" element={<AIWorkforce />} />
          <Route path="departments" element={<Departments />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="integrations" element={<Integrations />} />

          <Route
            path="crm-sales"
            element={
              <PlaceholderPage
                title="CRM & Sales"
                phase="Phase 3"
                description="Leads, customers, pipeline and deals for the Sales department."
                features={[
                  'Lead management and CRM records',
                  'Customer profiles and history',
                  'Visual sales pipeline and deal management',
                  'Follow-up scheduling and email outreach drafts',
                  'Proposal generation with approval gates',
                  'Sales forecasting and conversion analytics',
                ]}
              />
            }
          />
          <Route
            path="marketing"
            element={
              <PlaceholderPage
                title="Marketing"
                phase="Phase 3"
                description="Campaigns, content and growth analytics for the Marketing department."
                features={[
                  'Marketing campaign management',
                  'AI content generation with brand voice',
                  'Social media scheduling',
                  'SEO and competitor research',
                  'Audience segmentation',
                  'Campaign automation and ROI analytics',
                ]}
              />
            }
          />
          <Route
            path="finance"
            element={
              <PlaceholderPage
                title="Finance"
                phase="Phase 3"
                description="Money in, money out — with strict approval governance."
                features={[
                  'Income and expense tracking',
                  'Invoices and payment status',
                  'Budgets and cash-flow view',
                  'Profit & loss and financial forecasting',
                  'AI expense categorization and anomaly detection',
                  'Payments are CRITICAL risk — never executed by AI without authorization',
                ]}
              />
            }
          />
          <Route
            path="hr"
            element={
              <PlaceholderPage
                title="Human Resources"
                phase="Phase 3"
                description="People operations from recruitment to performance."
                features={[
                  'Employee database',
                  'Job postings and applicant tracking',
                  'Interview scheduling and onboarding',
                  'Attendance and leave management',
                  'Performance reviews',
                  'Employee communication',
                ]}
              />
            }
          />
          <Route
            path="projects"
            element={
              <PlaceholderPage
                title="Projects & Operations"
                phase="Phase 3"
                description="Projects, processes and day-to-day operations."
                features={[
                  'Project tracking with AI Project Manager',
                  'Business process management',
                  'Resource allocation',
                  'Vendor and inventory management',
                  'Workflow monitoring',
                  'Operational analytics',
                ]}
              />
            }
          />
          <Route
            path="support"
            element={
              <PlaceholderPage
                title="Customer Support"
                phase="Phase 3 (voice in Phase 5)"
                description="Tickets and AI-assisted support across channels."
                features={[
                  'Customer ticket and complaint management',
                  'AI support agents with human escalation',
                  'Email and WhatsApp support channels',
                  'Voice support via telephony provider (Phase 5)',
                  'Automated response drafts with approval policies',
                  'Customer satisfaction analytics',
                ]}
              />
            }
          />
          <Route
            path="automations"
            element={
              <PlaceholderPage
                title="Automations"
                phase="Phase 4"
                description="The OrynexAegis automation center, embedded in Opsera."
                features={[
                  'Visual workflow builder with triggers and conditions',
                  'AI agent, API and MCP tool nodes',
                  'Approval nodes and scheduled execution',
                  'Natural language to editable workflow',
                  'Multi-agent delegation workflows',
                  'Execution logs, retries and error handling',
                ]}
              />
            }
          />
          <Route
            path="analytics"
            element={
              <PlaceholderPage
                title="Analytics"
                phase="Phase 5"
                description="Business intelligence across every department."
                features={[
                  'Revenue, expense and profitability analytics',
                  'Sales forecasting and marketing ROI',
                  'Employee and department performance',
                  'Customer retention analysis',
                  'Business health scoring',
                  'Downloadable reports and AI summaries',
                ]}
              />
            }
          />
          <Route
            path="marketplace"
            element={
              <PlaceholderPage
                title="Agent Marketplace"
                phase="Phase 6 (registry browsing starts Phase 2)"
                description="Install specialized agents and reusable teams from OrynexAegis."
                features={[
                  'Browse agents by capability and department',
                  'Inspect permissions before installing',
                  'Install and assign agents to teams',
                  'Creative and engineering specialist agents',
                  'Reusable agent teams and workflow templates',
                  'Usage monitoring and uninstall',
                ]}
              />
            }
          />
          <Route
            path="settings"
            element={
              <PlaceholderPage
                title="Settings"
                phase="Phase 1 foundation, expanded in Phase 6"
                description="Organization, security and governance configuration."
                features={[
                  'Organization and workspace management',
                  'Roles and organization-specific permissions',
                  'Agent permission scopes and execution limits',
                  'Approval policies by risk level',
                  'API base URL via VITE_API_BASE_URL environment variable',
                  'Audit logs, data export and account deletion',
                ]}
              />
            }
          />
          <Route
            path="creative-studio"
            element={
              <PlaceholderPage
                title="Creative Studio"
                phase="Phase 3"
                description="AI-powered creative and media production department."
                features={[
                  'Creative project management and brand asset library',
                  'Design workspace (Canva, Adobe, Figma adapters)',
                  'Stage-tracked video production pipeline',
                  'Animation and motion graphics projects',
                  'Version history, review and approval',
                  'Export management per campaign and channel',
                ]}
              />
            }
          />
          <Route
            path="engineering-studio"
            element={
              <PlaceholderPage
                title="Engineering Studio"
                phase="Phase 3"
                description="AI software engineering team working on real repositories."
                features={[
                  'AI coding team with parallel, branch-isolated agents',
                  'Repository browsing, branches and commit history',
                  'Development task board with dependencies',
                  'Pull requests and AI code review',
                  'Testing and CI/CD status',
                  'Deployment management — production requires approval',
                ]}
              />
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
