import express from "express";
import { getAllAssets, getAssetById, updateAsset } from "../controllers/assetController.js";

const router = express.Router();

router.get("/", getAllAssets);
router.get("/:id", getAssetById);
router.patch("/:id", updateAsset);

export default router;
