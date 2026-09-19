# IRONside

**Industrial Asset Intelligence Command Center** — a predictive maintenance frontend prototype built for a Smart India Hackathon submission.

IRONside is the visual intelligence layer for a campus/industrial predictive-maintenance pipeline:

```
Physical Asset → Sensors → ESP32 Edge Node → Node.js/Express → MongoDB → Python ML → Anomaly Detection → Risk/Health Scoring → Alert → Technician Action → Feedback
```

This repo currently contains the **frontend only** (React + Vite + Tailwind), built against a mocked data layer shaped to match the backend's future REST contract, so it can be pointed at a real API later without touching component code.

## Quick start

```bash
git clone <your-repo-url>
cd ironside
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

```bash
npm run build     # production build to /dist
npm run preview   # preview the production build locally
```

## What's implemented

- **Landing page** — hero with a custom SVG industrial motor, scroll story (Machine → Signal → Intelligence → Decision → Action).
- **Command Center Overview** — KPI strip, fleet health donut, risk × criticality matrix, "what needs attention" ranking.
- **Asset Registry** — searchable/filterable table of all monitored assets.
- **Asset Detail** — health/risk gauges, live telemetry chart, baseline comparison, contributing-signal breakdown, anomaly timeline, maintenance recommendation.
- **Live Telemetry** — per-sensor cards, multi-series chart, demo telemetry payload viewer.
- **Alert Center** — severity-grouped alerts with a working detail modal (acknowledge / create work order / resolve / mark false positive).
- **Maintenance Queue** — kanban-style board (work order → assigned → in progress → completed).
- **Analytics** — fleet health trend, risk trend, anomaly frequency, alert resolution time.
- **System / Architecture** — interactive pipeline diagram and closed-loop feedback visualization.
- **Demo mode** — "Simulate Anomaly" on `MOTOR-01` drives a coherent, deterministic state change across telemetry, risk, health, alerts and the maintenance queue, and resolves back to healthy when the resulting work order is completed.

All demo/prototype data is explicitly labeled as such in the UI — no fabricated accuracy or performance claims.

## Project structure

```
ironside/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx      # React entry point
    ├── index.css     # Tailwind directives
    └── App.jsx       # Full application (pages, components, mock data layer)
```

`App.jsx` is intentionally a single file for now — it's organized into clearly commented sections (design tokens, mock data, shared components, one component per page). As the project grows, the natural next step is splitting it into `src/components/`, `src/pages/`, `src/services/`, and `src/types/` (see "Next steps" below).

## Tech stack

- React 18 + Vite
- Tailwind CSS
- [Recharts](https://recharts.org/) for charts
- [Lucide React](https://lucide.dev/) for icons

## Next steps / good first issues

- [ ] Split `App.jsx` into `src/pages/*`, `src/components/*`, `src/services/*`
- [ ] Replace the mock data layer with real API calls (`GET /api/assets`, `GET /api/assets/:id/readings`, etc.)
- [ ] Add WebSocket/SSE support for live telemetry instead of local simulation
- [ ] Add TypeScript types for `Asset`, `SensorReading`, `Alert`, `MaintenanceTask`
- [ ] Wire up the 3D motor as an optional WebGL upgrade (React Three Fiber) behind a performance fallback
- [ ] Persist maintenance/alert state to a backend instead of in-memory React state

## Contributing

1. Fork the repo / create a branch off `main`.
2. `npm install && npm run dev` to run locally.
3. Keep new UI within the existing design tokens defined at the top of `App.jsx` (colors, type scale) rather than introducing new ad-hoc styles.
4. Open a PR describing what changed and why.

## License

MIT — see `LICENSE`.
