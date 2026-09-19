import express from "express";
import { getAllAlerts, createAlert, updateAlert } from "../controllers/alertController.js";

const router = express.Router();

router.get("/", getAllAlerts);
router.post("/", createAlert);
router.patch("/:id", updateAlert);

export default router;
