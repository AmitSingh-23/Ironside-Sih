import { maintenance, assets, alerts } from "../data/mockDatabase.js";

// GET /api/maintenance
export const getAllMaintenance = (req, res) => {
  const { status, priority, assetId } = req.query;
  let result = [...maintenance];

  if (status) {
    result = result.filter((m) => m.status === status);
  }

  if (priority) {
    result = result.filter((m) => m.priority.toLowerCase() === priority.toLowerCase());
  }

  if (assetId) {
    result = result.filter((m) => m.assetId.toLowerCase() === assetId.toLowerCase());
  }

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
};

// POST /api/maintenance
export const createMaintenance = (req, res) => {
  const { assetId, issue, priority, recommended, technician, due } = req.body;

  if (!assetId || !issue) {
    return res.status(400).json({ success: false, message: "assetId and issue are required" });
  }

  const newTask = {
    id: `WO-${Math.floor(200 + Math.random() * 799)}`,
    assetId,
    issue,
    priority: priority || "Medium",
    recommended: recommended || "Inspect asset components and baseline tolerance.",
    technician: technician || "Unassigned",
    due: due || "3 days",
    status: "work_order",
  };

  maintenance.unshift(newTask);
  res.status(201).json({ success: true, data: newTask });
};

// PATCH /api/maintenance/:id
export const updateMaintenance = (req, res) => {
  const { id } = req.params;
  const index = maintenance.findIndex((m) => m.id.toLowerCase() === id.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ success: false, message: `Maintenance task ${id} not found` });
  }

  maintenance[index] = { ...maintenance[index], ...req.body };

  // Closed loop: if marked completed, heal the asset and resolve its open alerts
  if (req.body.status === "completed") {
    const targetAssetId = maintenance[index].assetId;
    const asset = assets.find((a) => a.id === targetAssetId);
    if (asset) {
      asset.status = "healthy";
      asset.health = 85;
      asset.risk = 15;
    }
    alerts.forEach((al) => {
      if (al.assetId === targetAssetId && al.status === "open") {
        al.status = "resolved";
      }
    });
  }

  res.json({ success: true, data: maintenance[index] });
};
