import {
  createMaterialService, getMaterialsService, getMaterialByIdService, deleteMaterialService, recordDownloadService,
  createSubmissionService, getSubmissionsService, deleteSubmissionService,
} from "./materials.service.js";
import Course from "../courses/courses.model.js";
import { ROLES } from "../../shared/constants/roles.js";

/* ── Materials ───────────────────────────────────────────────────────── */

// POST /api/materials — faculty (own course) or admin, multipart field "file"
export const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "A file is required" });
    const { course, title } = req.body;
    const courseDoc = await Course.findById(course);
    if (!courseDoc) return res.status(404).json({ message: "Course not found" });
    if (req.user.role !== ROLES.ADMIN && courseDoc.lecturer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only upload materials for courses you teach" });
    }

    const material = await createMaterialService({ course, title, uploadedBy: req.user._id, file: req.file });
    res.status(201).json(material);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/materials — student sees materials for enrolled courses,
// faculty sees materials for courses they teach, admin/managers see all.
export const getMaterials = async (req, res) => {
  try {
    const all = await getMaterialsService();
    let visible = all;
    if (req.user.role === ROLES.STUDENT) {
      visible = all.filter((m) => m.course?.students?.some((s) => s.toString() === req.user._id.toString()));
    } else if (req.user.role === ROLES.FACULTY) {
      visible = all.filter((m) => m.course?.lecturer?.toString() === req.user._id.toString());
    }
    res.status(200).json(visible);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/materials/:id/download — records that req.user downloaded this file
export const recordDownload = async (req, res) => {
  try {
    const material = await recordDownloadService(req.params.id, req.user._id);
    if (!material) return res.status(404).json({ message: "Material not found" });
    res.status(200).json(material);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/materials/:id — uploader or admin
export const deleteMaterial = async (req, res) => {
  try {
    const material = await getMaterialByIdService(req.params.id);
    if (!material) return res.status(404).json({ message: "Material not found" });
    if (req.user.role !== ROLES.ADMIN && material.uploadedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own materials" });
    }
    await deleteMaterialService(req.params.id);
    res.status(200).json({ message: "Material deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/* ── Submissions ─────────────────────────────────────────────────────── */

// POST /api/materials/submissions — student, must be enrolled in the course
export const submitAssignment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "A file is required" });
    const { course, note } = req.body;
    const courseDoc = await Course.findById(course);
    if (!courseDoc) return res.status(404).json({ message: "Course not found" });
    if (!courseDoc.students.some((s) => s.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    const submission = await createSubmissionService({ course, student: req.user._id, note, file: req.file });
    res.status(201).json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/materials/submissions — student sees their own; faculty sees
// submissions for courses they teach; admin sees all.
export const getSubmissions = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === ROLES.STUDENT) filter = { student: req.user._id };

    let all = await getSubmissionsService(filter);
    if (req.user.role === ROLES.FACULTY) {
      all = all.filter((s) => s.course?.lecturer?.toString() === req.user._id.toString());
    }
    res.status(200).json(all);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/materials/submissions/:id — student who submitted it, or admin
export const deleteSubmission = async (req, res) => {
  try {
    const all = await getSubmissionsService({ _id: req.params.id });
    const submission = all[0];
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    if (req.user.role !== ROLES.ADMIN && submission.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own submission" });
    }
    await deleteSubmissionService(req.params.id);
    res.status(200).json({ message: "Submission deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
