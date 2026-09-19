# IRONside Backend API

Predictive Maintenance REST API & Ingestion Engine for IRONside.

## Features
- **Asset Registry**: Track machinery metadata, learned baselines, and health/risk scores.
- **Telemetry Ingestion**: Direct endpoint for ESP32 edge nodes streaming multi-sensor packets (vibration, current, temperature, RPM).
- **Automated Anomaly Detection**: Evaluates incoming telemetry against asset baselines and updates risk dynamically.
- **Alert Triage**: Severity-based alert lifecycle management (open, acknowledged, resolved).
- **Maintenance Work Orders**: Closed-loop workflow from work order creation to technician resolution.
- **System Health**: Health and network status monitoring.

## Getting Started

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Server
```bash
# Development mode with watch
npm run dev

# Production start
npm start
```
Server runs by default on `http://localhost:5000`.

---

## API Endpoints

### Assets
- `GET /api/assets` — List all assets (supports `?status=healthy|attention|high-risk` & `?search=...`)
- `GET /api/assets/:id` — Get single asset with baseline and telemetry
- `PATCH /api/assets/:id` — Update asset status, health, or metadata

### Telemetry (ESP32 Ingestion)
- `POST /api/telemetry` — Ingest sensor packet
  ```json
  {
    "assetId": "MOTOR-01",
    "temperature": 38.2,
    "vibration": 0.285,
    "current": 1.04,
    "rpm": 1420
  }
  ```
- `GET /api/telemetry/:assetId` — Get telemetry history for an asset

### Alerts
- `GET /api/alerts` — List alerts (supports `?status=open|resolved` & `?severity=critical|attention|low`)
- `POST /api/alerts` — Create alert manually
- `PATCH /api/alerts/:id` — Update alert status (`acknowledged`, `resolved`, `falsePositive`)

### Maintenance
- `GET /api/maintenance` — List maintenance work orders
- `POST /api/maintenance` — Create new maintenance work order
- `PATCH /api/maintenance/:id` — Update work order status (`assigned`, `in_progress`, `completed`)
  *(Marking completed triggers the closed-loop recovery for the asset).*

### System Status
- `GET /api/system/status` — Platform diagnostics and edge node status
