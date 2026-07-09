import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// Resolved relative to this file (server/config/paths.js) rather than
// process.cwd(), so uploads always land in the same place on disk no matter
// which directory the process was started from (npm scripts, nodemon, a
// process manager, etc.).
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOADS_ROOT = path.join(__dirname, "..", "uploads");

/** Ensure `uploads/<subfolder>` exists on disk and return its absolute path. */
export function uploadsDir(subfolder = "") {
  const dir = path.join(UPLOADS_ROOT, subfolder);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Base URL used to build absolute links to uploaded files (e.g.
// "http://localhost:5000"). In production, set SERVER_PUBLIC_URL to the
// real public origin of this API (e.g. "https://api.your-campus.edu").
export const PUBLIC_URL =
  process.env.SERVER_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;

/** Build a public, downloadable URL for a file saved under uploads/<subfolder>/<filename>. */
export function publicUploadUrl(subfolder, filename) {
  return `${PUBLIC_URL}/uploads/${subfolder}/${filename}`;
}

/**
 * Best-effort removal of a file on disk given the public URL previously
 * returned by publicUploadUrl(). Never throws — a missing/malformed URL
 * shouldn't block deleting the DB record that referenced it.
 */
export function deleteUploadedFile(fileUrl) {
  try {
    const relative = new URL(fileUrl).pathname.replace(/^\/uploads\//, "");
    const filePath = path.join(UPLOADS_ROOT, relative);
    if (filePath.startsWith(UPLOADS_ROOT)) fs.unlink(filePath, () => {});
  } catch {
    // Ignore — fileUrl may be malformed, already deleted, or predate local storage.
  }
}
