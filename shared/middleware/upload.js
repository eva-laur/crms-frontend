import multer from "multer";
import crypto from "crypto";
import path from "path";
import { uploadsDir } from "../../config/paths.js";

/**
 * Local-disk upload storage (replaces the old Cloudinary-backed multer
 * config). Files are written under server/uploads/<folder>/ with a
 * collision-proof filename, and served back out via the express.static
 * mount registered in core/App.js ("/uploads" -> uploads/). Callers build
 * the public download URL with config/paths.js's publicUploadUrl(folder,
 * file.filename).
 */
function diskStorageFor(folder) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir(folder)),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const base = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 60);
      const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
      cb(null, `${base}-${unique}${ext}`);
    },
  });
}

// ─── FUEL RECEIPT UPLOADER ────────────────────────────────────────────────────
export const uploadReceipts = multer({
  storage: diskStorageFor("fuel-receipts"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP, and PDF files are allowed"), false);
    }
  },
}).array("receipts", 5); // up to 5 files, field name: "receipts"

// ─── GENERIC SINGLE IMAGE (reusable for other modules) ───────────────────────
export const uploadSingleImage = multer({
  storage: diskStorageFor("general"),
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("image");

// ─── COURSE MATERIALS / ASSIGNMENT SUBMISSIONS ────────────────────────────────
// Lecture notes, assignments, submissions — arbitrary document types, so no
// mimetype/format restriction beyond the size cap.
export const uploadMaterial = multer({
  storage: diskStorageFor("materials"),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB — matches the frontend's MAX_FILE_BYTES
}).single("file");

export const uploadSubmission = multer({
  storage: diskStorageFor("submissions"),
  limits: { fileSize: 20 * 1024 * 1024 },
}).single("file");

// ─── AUDIT EVIDENCE DOCUMENTS ─────────────────────────────────────────────────
// Free-form supporting documents (receipts, sign-off sheets, incident
// reports, etc.) a manager/admin attaches to the audit trail from the Audit
// page — see modules/audit/evidence.*.
export const uploadEvidence = multer({
  storage: diskStorageFor("evidence"),
  limits: { fileSize: 20 * 1024 * 1024 },
}).single("file");
