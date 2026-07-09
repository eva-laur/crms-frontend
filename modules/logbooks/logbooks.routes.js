import express from "express";
import {
  createLogbook, getLogbooks, getLogbookById, getLogbookByCourse,
  getMyLogbooks, getStudentView,
  addOutlineTopic, updateOutlineStatus, deleteOutlineTopic,
  addSession,
  addAssignment, recordAssignmentMark,
  addAssessment, recordAssessmentScore,
  addDeadline, deleteDeadline,
} from "./logbooks.controller.js";

import { protect, checkPermission } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", protect, checkPermission("logbooks", "view"), getLogbooks);
router.get("/my", protect, checkPermission("logbooks", "view"), getMyLogbooks);
router.get("/student-view/:courseId", protect, checkPermission("logbooks", "view"), getStudentView);
router.get("/course/:courseId", protect, checkPermission("logbooks", "view"), getLogbookByCourse);
router.get("/:id", protect, checkPermission("logbooks", "view"), getLogbookById);

router.post("/", protect, checkPermission("logbooks", "create"), createLogbook);

router.post("/:id/outline", protect, checkPermission("logbooks", "update"), addOutlineTopic);
router.patch("/:id/outline/:topicId/status", protect, checkPermission("logbooks", "update"), updateOutlineStatus);
router.delete("/:id/outline/:topicId", protect, checkPermission("logbooks", "update"), deleteOutlineTopic);

router.post("/:id/sessions", protect, checkPermission("logbooks", "update"), addSession);

router.post("/:id/assignments", protect, checkPermission("logbooks", "update"), addAssignment);
router.patch("/:id/assignments/:assignmentId/marks", protect, checkPermission("logbooks", "update"), recordAssignmentMark);

router.post("/:id/assessments", protect, checkPermission("logbooks", "update"), addAssessment);
router.patch("/:id/assessments/:assessmentId/scores", protect, checkPermission("logbooks", "update"), recordAssessmentScore);

router.post("/:id/deadlines", protect, checkPermission("logbooks", "update"), addDeadline);
router.delete("/:id/deadlines/:deadlineId", protect, checkPermission("logbooks", "update"), deleteDeadline);

export default router;