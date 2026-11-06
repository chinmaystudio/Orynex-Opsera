import type { Integration } from './types'

/**
 * Integration marketplace registry, mirrored from
 * docs/INTEGRATION_INVENTORY.md.
 *
 * Honesty rule (spec §5C / architecture): an integration without configured
 * credentials is `not_configured` — never shown as "Connected".
 */
export const INTEGRATIONS: Integration[] = [
  // Communication
  { name: 'Gmail', category: 'Communication', route: 'OAuth adapter', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Microsoft Outlook', category: 'Communication', route: 'OAuth adapter', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Slack', category: 'Communication', route: 'OAuth adapter', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Microsoft Teams', category: 'Communication', route: 'OAuth adapter', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Telegram', category: 'Communication', route: 'API key adapter', status: 'not_configured', phase: 'Phase 4' },
  { name: 'WhatsApp Business Cloud API', category: 'Communication', route: 'API adapter', status: 'not_configured', phase: 'Phase 5' },
  { name: 'Twilio (Voice + SMS)', category: 'Communication', route: 'API key adapter', status: 'not_configured', phase: 'Phase 5' },

  // Productivity
  { name: 'Google Calendar', category: 'Productivity', route: 'OAuth adapter', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Google Drive', category: 'Productivity', route: 'OAuth adapter', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Google Docs', category: 'Productivity', route: 'OAuth adapter', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Google Sheets', category: 'Productivity', route: 'OAuth adapter', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Microsoft Calendar', category: 'Productivity', route: 'OAuth adapter', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Microsoft OneDrive', category: 'Productivity', route: 'OAuth adapter', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Microsoft Excel', category: 'Productivity', route: 'OAuth adapter', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Notion', category: 'Productivity', route: 'OAuth adapter', status: 'not_configured', phase: 'Phase 4' },

  // Development
  { name: 'GitHub', category: 'Development', route: 'OAuth / PAT adapter', status: 'not_configured', phase: 'Phase 3' },
  { name: 'GitLab', category: 'Development', route: 'OAuth / PAT adapter', status: 'not_configured', phase: 'Phase 3' },
  { name: 'Bitbucket', category: 'Development', route: 'OAuth / PAT adapter', status: 'not_configured', phase: 'Phase 3' },

  // CRM & sales
  { name: 'HubSpot', category: 'CRM & Sales', route: 'OAuth adapter', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Salesforce', category: 'CRM & Sales', route: 'OAuth adapter', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Zoho CRM', category: 'CRM & Sales', route: 'OAuth adapter', status: 'not_configured', phase: 'Phase 4' },

  // Finance
  { name: 'Stripe', category: 'Finance', route: 'API key adapter — payments are CRITICAL risk, approval-gated', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Razorpay', category: 'Finance', route: 'API key adapter — payments are CRITICAL risk, approval-gated', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Zoho Books', category: 'Finance', route: 'OAuth adapter', status: 'not_configured', phase: 'Phase 4' },

  // HR
  { name: 'Zoho People', category: 'HR', route: 'API adapter', status: 'not_configured', phase: 'Phase 4' },

  // AI & research
  { name: 'OpenAI', category: 'AI & Research', route: 'API key — provider-independent LLM abstraction', status: 'not_configured', phase: 'Phase 2' },
  { name: 'Anthropic', category: 'AI & Research', route: 'API key — provider-independent LLM abstraction', status: 'not_configured', phase: 'Phase 2' },
  { name: 'Google Gemini', category: 'AI & Research', route: 'API key — provider-independent LLM abstraction', status: 'not_configured', phase: 'Phase 2' },
  { name: 'OpenAI-compatible providers', category: 'AI & Research', route: 'API key — custom base URL', status: 'not_configured', phase: 'Phase 2' },
  { name: 'Perplexity', category: 'AI & Research', route: 'API key — research provider', status: 'not_configured', phase: 'Phase 2' },

  // Creative
  { name: 'Canva', category: 'Creative', route: 'MCP / API where officially supported', status: 'not_configured', phase: 'Phase 3' },
  { name: 'Adobe Creative Cloud & Firefly', category: 'Creative', route: 'API / connector where officially supported', status: 'not_configured', phase: 'Phase 3' },
  { name: 'Figma', category: 'Creative', route: 'API adapter', status: 'not_configured', phase: 'Phase 3' },
  { name: 'Gamma', category: 'Creative', route: 'API adapter', status: 'not_configured', phase: 'Phase 3' },

  // Coding agents
  { name: 'OpenAI Codex', category: 'Coding Agents', route: 'Official API / CLI in isolated branches', status: 'not_configured', phase: 'Phase 3' },
  { name: 'Claude Code', category: 'Coding Agents', route: 'Official CLI in isolated branches', status: 'not_configured', phase: 'Phase 3' },
  { name: 'GitHub Copilot', category: 'Coding Agents', route: 'Repository integration', status: 'not_configured', phase: 'Phase 3' },
  { name: 'Cursor', category: 'Coding Agents', route: 'Supported interfaces only', status: 'not_configured', phase: 'Phase 3' },

  // Automation
  { name: 'n8n', category: 'Automation', route: 'Workflow engine integration', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Webhooks', category: 'Automation', route: 'Inbound / outbound webhooks with signature validation', status: 'not_configured', phase: 'Phase 4' },
  { name: 'Custom REST APIs', category: 'Automation', route: 'API adapter interface', status: 'not_configured', phase: 'Phase 4' },
  { name: 'External MCP servers', category: 'Automation', route: 'Custom MCP server registration', status: 'not_configured', phase: 'Phase 4' },

  // ORYNEX CORE
  { name: 'ORYNEX CORE', category: 'ORYNEX Ecosystem', route: 'CORE SDK client — SSO, agent discovery, events, audit, usage', status: 'not_configured', phase: 'Phase 6' },
]
