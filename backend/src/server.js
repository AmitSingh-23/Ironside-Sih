import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import assetRoutes from "./routes/assetRoutes.js";
import telemetryRoutes from "./routes/telemetryRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Middleware
app.use(cors({ origin: "*", credentials: false }));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Root & Health check
app.get("/", (req, res) => {
  res.json({
    name: "IRONside API",
    status: "online",
    version: "0.1.0",
    docs: "/api/system/status",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/assets", assetRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/system", systemRoutes);


// Dedicated Edge Sensor Route (as requested by user)
app.get("/api/sensor-data", (req, res) => {
  // Simulate live hardware data coming from ESP32 edge node
  const wobble = (Math.random() - 0.5) * 0.04;
  res.json({
    assetId: "MOTOR-01",
    timestamp: Date.now(),
    vibration: +(4.2 + wobble + (Math.random() > 0.8 ? 0.3 : 0)).toFixed(3), // Injecting a fault level vibration
    current: +(1.4 + wobble * 2).toFixed(2),
    temperature: +(62.5 + wobble * 10).toFixed(1),
    rpm: Math.round(1420 + wobble * 400),
    humidity: 45,
    status: "high-risk"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({ success: false, message: "Internal server error", error: err.message });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 IRONside API Server running on port ${PORT}`);
  console.log(`📡 Endpoints: http://localhost:${PORT}/api/assets`);
  console.log(`⚙️  Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`========================================`);
});
