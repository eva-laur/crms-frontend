import express from "express";
import {
  createResult,
  addAssessmentResult,
  updateAssessmentResult,
  getResults,
  getResultById,
  getResultsByStudent,
  getResultsByCourse,
} from "./results.controller.js";

import { protect, checkPermission } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", protect, checkPermission("results", "view"), getResults);
router.get("/:id", protect, checkPermission("results", "view"), getResultById);
router.get("/student/:studentId", protect, checkPermission("results", "view"), getResultsByStudent);
router.get("/course/:courseId", protect, checkPermission("results", "view"), getResultsByCourse);

router.post("/", protect, checkPermission("results", "create"), createResult);
router.put("/:id/assessment", protect, checkPermission("results", "update"), addAssessmentResult);
router.put("/:id/assessment/:assessmentId", protect, checkPermission("results", "update"), updateAssessmentResult);

export default router;