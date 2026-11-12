# IRONside: Industrial Asset Intelligence Command Center

A predictive-maintenance dashboard prototype: sensor data from machines flows through an ESP32 edge node into an API that scores machine health and raises alerts, and a React dashboard shows it live with interactive 3D machine models.

Team project for the Smart India Hackathon internal round at **NIT Raipur** (Top 50 teams).

```
Machine → Sensors → ESP32 edge node → Express API → health/risk scoring → alert → maintenance work order
```

## What's in this repo

| Part | Path | What it does |
| --- | --- | --- |
| Dashboard | `frontend/` | React 18 + Vite + Tailwind. Live health and risk charts (Recharts), alert triage, and exploded 3D models of six machine types (Three.js / react-three-fiber). |
| API | `backend/` | Express REST API with 13 endpoints for assets, telemetry ingestion, alerts, maintenance work orders and system status. |
| Firmware | `backend/esp32_firmware/` | Arduino sketch for an ESP32 reading vibration (MPU6050), temperature (DS18B20), current (ACS712) and humidity (DHT22), posting JSON to the API over Wi-Fi. |

## How the scoring works

Each asset has a baseline range for vibration, current and temperature. When a telemetry packet arrives, the API compares it with the baseline, updates the asset's risk and health scores, and opens an alert if the asset becomes high-risk. This is threshold-based anomaly detection, not a trained ML model.

## Current status

This is a hackathon prototype. Things to know before you run it:

- **Data is held in memory.** The API uses a seeded in-memory store (`backend/src/data/mockDatabase.js`), so data resets on restart. A MongoDB schema for sensor readings is sketched in `backend/src/models/SensorReading.js` but is not wired in yet.
- **The dashboard falls back to simulated data** when the API is unreachable, so the UI can be demoed on its own.
- **No authentication** on the API.

## Quick start

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev          # http://localhost:5000
```

Frontend, in a second terminal:

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

To point the dashboard at an API on another machine, set `VITE_API_URL` in `frontend/.env`, for example `VITE_API_URL=http://192.168.1.4:5000`.

For the ESP32, open `backend/esp32_firmware/esp32_sensor_node.ino`, set your Wi-Fi credentials and the API address, and flash it. Wiring is documented at the top of the sketch.

## API overview

| Area | Endpoints |
| --- | --- |
| Assets | `GET /api/assets`, `GET /api/assets/:id`, `PATCH /api/assets/:id` |
| Telemetry | `POST /api/telemetry`, `POST /api/telemetry/ingest`, `GET /api/telemetry/:assetId` |
| Alerts | `GET /api/alerts`, `POST /api/alerts`, `PATCH /api/alerts/:id` |
| Maintenance | `GET /api/maintenance`, `POST /api/maintenance`, `PATCH /api/maintenance/:id` |
| System | `GET /api/system/status` |

Details and example payloads are in [`backend/README.md`](backend/README.md).

## What I worked on

I ([Amit Singh Bisht](https://github.com/AmitSingh-23)) built the Express API and the React dashboard views, including the charts and 3D machine models.

## Next steps

- Persist telemetry and alerts in MongoDB
- Replace baseline thresholds with a trained anomaly model
- Add authentication and API tests

## License

MIT. See [`LICENSE`](LICENSE).
