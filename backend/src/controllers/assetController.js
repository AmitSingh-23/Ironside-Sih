import { assets } from "../data/mockDatabase.js";

// GET /api/assets
export const getAllAssets = (req, res) => {
  const { status, search } = req.query;
  let result = [...assets];

  if (status && status !== "all") {
    result = result.filter((a) => a.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
};

// GET /api/assets/:id
export const getAssetById = (req, res) => {
  const { id } = req.params;
  const asset = assets.find((a) => a.id.toLowerCase() === id.toLowerCase());

  if (!asset) {
    return res.status(404).json({ success: false, message: `Asset with id ${id} not found` });
  }

  res.json({ success: true, data: asset });
};

// PATCH /api/assets/:id
export const updateAsset = (req, res) => {
  const { id } = req.params;
  const index = assets.findIndex((a) => a.id.toLowerCase() === id.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ success: false, message: `Asset with id ${id} not found` });
  }

  assets[index] = { ...assets[index], ...req.body };
  res.json({ success: true, data: assets[index] });
};
