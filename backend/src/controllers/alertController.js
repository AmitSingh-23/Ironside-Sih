import { alerts } from "../data/mockDatabase.js";

// GET /api/alerts
export const getAllAlerts = (req, res) => {
  const { status, severity } = req.query;
  let result = [...alerts];

  if (status) {
    result = result.filter((a) => a.status === status);
  }

  if (severity) {
    result = result.filter((a) => a.severity === severity);
  }

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
};

// POST /api/alerts
export const createAlert = (req, res) => {
  const { severity, assetId, signal, message, risk } = req.body;

  if (!assetId || !signal) {
    return res.status(400).json({ success: false, message: "assetId and signal are required" });
  }

  const newAlert = {
    id: `ALT-${Math.floor(100 + Math.random() * 899)}`,
    severity: severity || "attention",
    assetId,
    signal,
    message: message || "Anomaly detected by automated monitoring.",
    risk: risk || 50,
    time: "just now",
    status: "open",
  };

  alerts.unshift(newAlert);
  res.status(201).json({ success: true, data: newAlert });
};

// PATCH /api/alerts/:id
export const updateAlert = (req, res) => {
  const { id } = req.params;
  const index = alerts.findIndex((a) => a.id.toLowerCase() === id.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ success: false, message: `Alert with id ${id} not found` });
  }

  alerts[index] = { ...alerts[index], ...req.body };
  res.json({ success: true, data: alerts[index] });
};
