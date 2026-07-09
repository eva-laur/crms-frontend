import {
  createEvidenceDocumentService,
  getEvidenceDocumentsService,
  deleteEvidenceDocumentService,
} from "./evidence.service.js";

// POST /api/audit/documents
export const uploadEvidenceDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "A file is required" });
    const { title, note, module } = req.body;
    if (!title || !module) return res.status(400).json({ message: "title and module are required" });

    const doc = await createEvidenceDocumentService({
      title, note, module, uploadedBy: req.user._id, file: req.file,
    });
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/audit/documents — admin sees all, managers see only their own uploads.
export const getEvidenceDocuments = async (req, res) => {
  try {
    const docs = await getEvidenceDocumentsService({ userId: req.user._id, role: req.user.role });
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/audit/documents/:id — uploader or admin only.
export const deleteEvidenceDocument = async (req, res) => {
  try {
    const result = await deleteEvidenceDocumentService(req.params.id, { userId: req.user._id, role: req.user.role });
    if (!result) return res.status(404).json({ message: "Document not found" });
    if (result === "forbidden") return res.status(403).json({ message: "You can only delete your own uploads" });
    res.status(200).json({ message: "Document deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
