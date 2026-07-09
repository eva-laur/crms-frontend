import { Material, Submission } from "./materials.model.js";
import { publicUploadUrl, deleteUploadedFile } from "../../config/paths.js";

/* ── Materials ───────────────────────────────────────────────────────── */
export const createMaterialService = async ({ course, title, uploadedBy, file }) => {
  const m = await Material.create({
    course, title, uploadedBy,
    fileUrl: publicUploadUrl("materials", file.filename),
    fileName: file.originalname,
    fileSize: file.size,
    fileType: file.mimetype,
  });
  return m.populate([{ path: "course" }, { path: "uploadedBy", select: "name email role" }]);
};

export const getMaterialsService = async (filter = {}) => {
  return Material.find(filter)
    .populate("course")
    .populate("uploadedBy", "name email role")
    .sort({ createdAt: -1 });
};

export const getMaterialByIdService = async (id) => Material.findById(id).populate("course").populate("uploadedBy", "name email role");

export const deleteMaterialService = async (id) => {
  const m = await Material.findByIdAndDelete(id);
  if (m?.fileUrl) deleteUploadedFile(m.fileUrl);
  return m;
};

export const recordDownloadService = async (id, userId) => {
  return Material.findByIdAndUpdate(id, { $addToSet: { downloads: userId } }, { new: true });
};

/* ── Submissions ─────────────────────────────────────────────────────── */
export const createSubmissionService = async ({ course, student, note, file }) => {
  const s = await Submission.create({
    course, student, note,
    fileUrl: publicUploadUrl("submissions", file.filename),
    fileName: file.originalname,
    fileSize: file.size,
    fileType: file.mimetype,
  });
  return s.populate([{ path: "course" }, { path: "student", select: "name email matricule" }]);
};

export const getSubmissionsService = async (filter = {}) => {
  return Submission.find(filter)
    .populate("course")
    .populate("student", "name email matricule")
    .sort({ createdAt: -1 });
};

export const deleteSubmissionService = async (id) => {
  const s = await Submission.findByIdAndDelete(id);
  if (s?.fileUrl) deleteUploadedFile(s.fileUrl);
  return s;
};
