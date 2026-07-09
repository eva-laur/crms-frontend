import multer from "multer";
import crypto from "crypto";
import path from "path";
import { uploadsDir } from "./paths.js";

// Local-disk storage for bus fuel-log photo evidence (odometer/receipt
// photos) — previously used multer's in-memory storage, which discarded the
// uploaded bytes on every request (file.buffer was never persisted anywhere),
// despite code elsewhere assuming a Cloudinary URL would come back. Files are
// now written to server/uploads/fuel-logs/ and served via the "/uploads"
// static mount in core/App.js; see mileage.service.js for the URL it builds.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir("fuel-logs")),
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

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
