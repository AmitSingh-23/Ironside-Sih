import { assets, alerts, maintenance } from "../data/mockDatabase.js";

// GET /api/system/status
export const getSystemStatus = (req, res) => {
  const totalAssets = assets.length;
  const healthyCount = assets.filter((a) => a.status === "healthy").length;
  const attentionCount = assets.filter((a) => a.status === "attention").length;
  const highRiskCount = assets.filter((a) => a.status === "high-risk").length;
  const openAlertsCount = alerts.filter((a) => a.status === "open").length;
  const openWorkOrdersCount = maintenance.filter((m) => m.status !== "completed").length;

  res.json({
    success: true,
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      nodes: [
        { name: "ESP32 Edge Network", status: "Operational", onlineCount: 5, totalCount: 5 },
        { name: "Node.js / Express API", status: "Operational", port: process.env.PORT || 5000 },
        { name: "Database Store", status: "Operational", type: "In-Memory / MongoDB Ready" },
        { name: "ML Inference Engine", status: "Operational", model: "IsolationForest-v1" },
        { name: "Frontend Command Center", status: "Operational", framework: "React 18 + Vite" },
      ],
      metrics: {
        totalAssets,
        healthyCount,
        attentionCount,
        highRiskCount,
        openAlertsCount,
        openWorkOrdersCount,
      },
    },
  });
};
