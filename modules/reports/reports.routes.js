import express from "express";
import {
  getStudentReport,
  getCourseReport,
  getResourceUtilization,
  getResourceTypeUtilization,
} from "./reports.controller.js";
import { protect, checkPermission } from "../../middleware/auth.js";

const router = express.Router();

// Student reports
router.get(
  "/student/:studentId",
  protect,
  checkPermission("reports", "view_student"),
  getStudentReport
);

// Course reports
router.get(
  "/course/:courseId",
  protect,
  checkPermission("reports", "view_course"),
  getCourseReport
);

// Resource utilization reports (admin / manager roles only)
router.get(
  "/utilization/by-resource",
  protect,
  checkPermission("reports", "view_utilization"),
  getResourceUtilization
);

router.get(
  "/utilization/by-type",
  protect,
  checkPermission("reports", "view_utilization"),
  getResourceTypeUtilization
);

export default router;
