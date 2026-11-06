import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import LandingPage from './pages/LandingPage'
import CommandCenter from './pages/CommandCenter'
import AIWorkforce from './pages/AIWorkforce'
import Departments from './pages/Departments'
import Tasks from './pages/Tasks'
import Approvals from './pages/Approvals'
import Integrations from './pages/Integrations'
import CrmSales from './pages/CrmSales'
import Marketing from './pages/Marketing'
import Finance from './pages/Finance'
import Hr from './pages/Hr'
import ProjectsOps from './pages/ProjectsOps'
import Support from './pages/Support'
import Automations from './pages/Automations'
import Analytics from './pages/Analytics'
import Marketplace from './pages/Marketplace'
import CreativeStudio from './pages/CreativeStudio'
import EngineeringStudio from './pages/EngineeringStudio'
import Settings from './pages/Settings'

/** Pre-/app module paths, kept working via redirects. */
const LEGACY_PATHS = [
  'ai-workforce',
  'departments',
  'tasks',
  'approvals',
  'integrations',
  'crm-sales',
  'marketing',
  'finance',
  'hr',
  'projects',
  'support',
  'automations',
  'analytics',
  'marketplace',
  'settings',
  'creative-studio',
  'engineering-studio',
] as const

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public marketing site */}
        <Route path="/" element={<LandingPage />} />

        {/* Application (Command Center + all modules) */}
        <Route path="/app" element={<AppShell />}>
          <Route index element={<CommandCenter />} />
          <Route path="ai-workforce" element={<AIWorkforce />} />
          <Route path="departments" element={<Departments />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="integrations" element={<Integrations />} />

          <Route path="crm-sales" element={<CrmSales />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="finance" element={<Finance />} />
          <Route path="hr" element={<Hr />} />
          <Route path="projects" element={<ProjectsOps />} />
          <Route path="support" element={<Support />} />
          <Route path="automations" element={<Automations />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="settings" element={<Settings />} />
          <Route path="creative-studio" element={<CreativeStudio />} />
          <Route path="engineering-studio" element={<EngineeringStudio />} />

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>

        {/* Legacy redirects: old flat module URLs keep working. */}
        {LEGACY_PATHS.map((p) => (
          <Route
            key={p}
            path={`/${p}`}
            element={<Navigate to={`/app/${p}`} replace />}
          />
        ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
