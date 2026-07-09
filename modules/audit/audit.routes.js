import express from "express";
import { getAuditLogs } from "./audit.controller.js";
import {
  uploadEvidenceDocument, getEvidenceDocuments, deleteEvidenceDocument,
} from "./evidence.controller.js";
import { uploadEvidence } from "../../shared/middleware/upload.js";
import { protect, checkPermission } from "../../middleware/auth.js";

const router = express.Router();

// Admin only — paginated
// ?module=bookings&actor=userId&startDate=2026-01-01&endDate=2026-12-31&page=1&limit=50
router.get("/", protect, checkPermission("audit", "view"), getAuditLogs);

// "My uploaded files" — same page, same permission gate. Admin sees every
// upload; every other role (the 4 manager roles that have "audit:view")
// only sees documents they uploaded themselves — enforced in
// evidence.service.js, not just hidden client-side.
router.get("/documents", protect, checkPermission("audit", "view"), getEvidenceDocuments);
router.post("/documents", protect, checkPermission("audit", "view"), uploadEvidence, uploadEvidenceDocument);
router.delete("/documents/:id", protect, checkPermission("audit", "view"), deleteEvidenceDocument);

export default router;
