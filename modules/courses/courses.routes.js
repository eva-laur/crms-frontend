import express from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  enrollStudent,
  unenrollStudent,
  updateCourse,
  deleteCourse,
} from "./courses.controller.js";
import { protect, checkPermission } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", protect, checkPermission("courses", "view"), getCourses);
router.get("/:id", protect, checkPermission("courses", "view"), getCourseById);

router.post("/", protect, checkPermission("courses", "manage"), createCourse);
router.put("/:id", protect, checkPermission("courses", "manage"), updateCourse);
router.delete("/:id", protect, checkPermission("courses", "manage"), deleteCourse);

router.put("/:courseId/enroll", protect, checkPermission("courses", "enroll"), enrollStudent);
router.put("/:courseId/unenroll", protect, checkPermission("courses", "enroll"), unenrollStudent);

export default router;