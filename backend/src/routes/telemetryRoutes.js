import express from "express";
import { ingestTelemetry, getTelemetryByAsset } from "../controllers/telemetryController.js";

const router = express.Router();

// Direct ESP32 Ingestion
router.post("/", ingestTelemetry);
router.post("/ingest", ingestTelemetry);

// Telemetry queries
router.get("/:assetId", getTelemetryByAsset);

export default router;
