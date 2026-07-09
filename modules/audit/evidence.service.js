import EvidenceDocument from "./evidence.model.js";
import { publicUploadUrl, deleteUploadedFile } from "../../config/paths.js";

export const createEvidenceDocumentService = async ({ title, note, module, uploadedBy, file }) => {
  const doc = await EvidenceDocument.create({
    title,
    note: note || "",
    module,
    uploadedBy,
    fileUrl:  publicUploadUrl("evidence", file.filename),
    fileName: file.originalname,
    fileSize: file.size,
    fileType: file.mimetype,
  });
  return doc.populate("uploadedBy", "name email role");
};

// Admin sees every uploaded evidence document; everyone else (the manager
// roles that can reach the Audit page) only sees their own uploads — same
// "what they manage" scoping as the audit log feed itself.
export const getEvidenceDocumentsService = async ({ userId, role }) => {
  const filter = role === "admin" ? {} : { uploadedBy: userId };
  return EvidenceDocument.find(filter)
    .populate("uploadedBy", "name email role")
    .sort({ createdAt: -1 });
};

export const deleteEvidenceDocumentService = async (id, { userId, role }) => {
  const doc = await EvidenceDocument.findById(id);
  if (!doc) return null;
  if (role !== "admin" && doc.uploadedBy.toString() !== userId.toString()) {
    return "forbidden";
  }
  await EvidenceDocument.findByIdAndDelete(id);
  deleteUploadedFile(doc.fileUrl);
  return doc;
};
