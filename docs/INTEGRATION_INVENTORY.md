# Integration Inventory — honest status (Rule: never claim connected without credentials)

| Category | Provider | Route | Phase 1 status |
|---|---|---|---|
| Comms | Gmail, Outlook, Slack, Teams, Telegram, WhatsApp Cloud, Twilio (voice+SMS) | OAuth / API key adapters | Adapter interface + registry entry, `not_configured` |
| Productivity | Google Calendar/Drive/Docs/Sheets, MS Calendar/OneDrive/Excel, Notion | OAuth adapters | Registry only |
| Dev | GitHub (connected for Chinmay via Muse, not yet wired into Opsera), GitLab, Bitbucket | OAuth/PAT | Registry only; GitHub first real adapter in Phase 3/Engineering |
| CRM | HubSpot, Salesforce, Zoho CRM | OAuth | Registry only |
| Finance | Stripe, Razorpay, Zoho Books | API key/OAuth | Registry only; payments = CRITICAL risk, approval-gated |
| HR | Zoho People + HRMS | API | Registry only |
| AI | OpenAI, Anthropic, Gemini, OpenAI-compatible, Perplexity | API key, provider-independent LLM abstraction | Interface defined in backend |
| Creative | Canva (MCP), Adobe CC/Firefly, Figma, Gamma, image/video/stock/audio providers | MCP/API where officially supported | Registry only (§18) |
| Coding agents | Codex, Claude Code, Copilot, Cursor | Official API/MCP/CLI only, isolated branches/worktrees | Registry only (§19) |
| Automation | n8n, webhooks, custom REST, external MCP servers | — | Phase 4 |
| ORYNEX CORE | SSO, orgs, agent discovery, events, audit, usage | CORE SDK client stub | Interface defined |

Opsera's own MCP server (20 tools listed in spec §5A) ships in Phase 4 with OAuth/scoped tokens, org isolation, audit, rate limits.
