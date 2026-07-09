import express from "express";
import {
  createAttendance,
  markAttendance,
  getAttendance,
  getAttendanceById,
  getAttendanceByCourse,
  getAttendanceByStudent,
} from "./attendance.controller.js";
import { protect, checkPermission } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", protect, checkPermission("attendance", "view"), getAttendance);

router.get("/:id", protect, checkPermission("attendance", "view"), getAttendanceById);

router.get("/course/:courseId", protect, checkPermission("attendance", "view"), getAttendanceByCourse);

router.get("/student/:studentId", protect, checkPermission("attendance", "view"), getAttendanceByStudent);

router.post("/", protect, checkPermission("attendance", "create"), createAttendance);

router.put("/:id/mark", protect, checkPermission("attendance", "update"), markAttendance);

export default router;