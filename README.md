# IRONside — Industrial Asset Intelligence Command Center

A predictive maintenance dashboard prototype (Frontend + Backend) built as a group project for the internal hackathon at **NIT Raipur**.

IRONside provides the visual intelligence layer for a campus/industrial predictive-maintenance pipeline:

```
Physical Asset → Sensors → ESP32 Edge Node → Node.js/Express → MongoDB → Python ML → Anomaly Detection → Risk/Health Scoring → Alert → Technician Action → Feedback
```

## Repository Structure

This repository is a monorepo containing both the frontend application and the backend API:

- `/frontend` - React 18 + Vite + Tailwind CSS dashboard.
- `/backend` - Node.js/Express REST API and ingestion engine for IoT sensor data.

## Quick Start

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```
The backend server will start on `http://localhost:5001`.

### 2. Start the Frontend

In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend application will start on `http://localhost:5173`.

## Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- [Recharts](https://recharts.org/) for charts
- [Lucide React](https://lucide.dev/) for icons

**Backend:**
- Node.js
- Express
- MongoDB (via Mongoose)

## Team

Developed as a collaborative group project for the NIT Raipur internal hackathon. 

*(Add your team members' names/roles here)*
- **Team Member 1** 
- **Team Member 2**
- **Team Member 3**

## License
MIT — see `LICENSE`.
