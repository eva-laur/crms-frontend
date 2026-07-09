import express from "express";
import {
  createCourseProgress,
  getCourseProgress,
  getCourseProgressById,
  addTopic,
  addAssessment,
  updateTopicStatus,
} from "./courseProgress.controller.js";
import { protect, checkPermission } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", protect, checkPermission("course_progress", "view"), getCourseProgress);

router.get("/:id", protect, checkPermission("course_progress", "view"), getCourseProgressById);

router.post("/", protect, checkPermission("course_progress", "create"), createCourseProgress);

router.put("/:id/topic", protect, checkPermission("course_progress", "update"), addTopic);

router.put("/:id/assessment", protect, checkPermission("course_progress", "update"), addAssessment);

router.patch("/:id/topic/:topicId/status",
  protect,
  checkPermission("course_progress", "update"),
  updateTopicStatus
);

export default router;