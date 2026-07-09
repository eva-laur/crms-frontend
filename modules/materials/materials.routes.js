import express from "express";
import {
  uploadMaterial, getMaterials, recordDownload, deleteMaterial,
  submitAssignment, getSubmissions, deleteSubmission,
} from "./materials.controller.js";
import { protect, checkPermission } from "../../middleware/auth.js";
import { uploadMaterial as uploadMaterialFile, uploadSubmission as uploadSubmissionFile } from "../../shared/middleware/upload.js";

const router = express.Router();

// Materials (lecture notes, handouts, ...)
router.get("/", protect, checkPermission("materials", "view"), getMaterials);
router.post("/", protect, checkPermission("materials", "create"), uploadMaterialFile, uploadMaterial);
router.patch("/:id/download", protect, checkPermission("materials", "view"), recordDownload);
router.delete("/:id", protect, checkPermission("materials", "create"), deleteMaterial);

// Assignment submissions (students uploading work back to a lecturer)
router.get("/submissions", protect, checkPermission("materials", "view"), getSubmissions);
router.post("/submissions", protect, checkPermission("materials", "submit"), uploadSubmissionFile, submitAssignment);
router.delete("/submissions/:id", protect, checkPermission("materials", "submit"), deleteSubmission);

export default router;
