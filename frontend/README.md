# OrynexOpraq — Frontend (Phase 1)

React + Vite + TypeScript + Tailwind CSS v3 + lucide-react + react-router-dom.

## Run

```bash
npm install
npm run dev        # dev server (default http://localhost:5173)
npm run build      # production build (tsc + vite build) -> dist/
npm run preview    # serve the production build
```

## Configuration

The app talks to the OrynexOpraq FastAPI backend via `VITE_API_BASE_URL`
(see `.env.example`); it defaults to `http://localhost:8000`.

Expected backend endpoints:

- `GET /api/v1/overview` — executive aggregates for the Command Center
- `GET /api/v1/agents` — AI agent registry
- `GET /api/v1/departments` — department records
- `GET /api/v1/tasks`, `POST /api/v1/tasks` — unified task list + create
- `GET /api/v1/approvals`, `PATCH /api/v1/approvals/:id` — approval queue
- `POST /api/v1/command` — natural-language command -> execution plan

## Honesty rules baked in

- If the backend is unreachable, pages show a clear "Backend offline" state.
  No metrics, plans or results are ever fabricated client-side.
- The AI Workforce page falls back to the 40 built-in agent presets
  (`src/lib/presets.ts`) only when the backend is offline, and labels that
  fallback with a banner.
- Every integration in the marketplace (`src/lib/integrations.ts`, mirrored
  from `docs/INTEGRATION_INVENTORY.md`) is shown as **Not configured** until
  real credentials are connected — never "Connected".
- Modules scheduled for later phases render an honest placeholder page
  stating their scope and phase.
