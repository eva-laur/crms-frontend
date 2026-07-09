import express from "express";
import { createAnnouncement, getAnnouncements, deleteAnnouncement } from "./announcements.controller.js";
import { protect, checkPermission } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", protect, checkPermission("announcements", "view"), getAnnouncements);
router.post("/", protect, checkPermission("announcements", "create"), createAnnouncement);
router.delete("/:id", protect, checkPermission("announcements", "create"), deleteAnnouncement);

export default router;
