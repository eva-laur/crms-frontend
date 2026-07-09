import express from "express";
import { createCancellation, getCancellations } from "./cancellations.controller.js";
import { protect, checkPermission } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", protect, checkPermission("cancellations", "view"), getCancellations);
router.post("/", protect, checkPermission("cancellations", "create"), createCancellation);

export default router;
