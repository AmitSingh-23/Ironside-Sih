import express from "express";
import { getAllMaintenance, createMaintenance, updateMaintenance } from "../controllers/maintenanceController.js";

const router = express.Router();

router.get("/", getAllMaintenance);
router.post("/", createMaintenance);
router.patch("/:id", updateMaintenance);

export default router;
