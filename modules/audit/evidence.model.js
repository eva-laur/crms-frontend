import mongoose from "mongoose";

// Free-form supporting documents managers/admin attach from the Audit page
// (see app.audit.tsx's "Upload document" dialog) — e.g. a signed handover
// sheet, an incident report, a maintenance invoice. Deliberately separate
// from AuditLog (which is an automatic, append-only trail of API actions):
// this is a manually-curated set of files a manager chooses to keep on
// record, scoped to their own domain the same way audit logs are.
const evidenceDocumentSchema = new mongoose.Schema(
  {
    title:      { type: String, required: true, trim: true },
    note:       { type: String, default: "" },
    module:     { type: String, required: true }, // e.g. "resources", "bookings", "bus"
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileUrl:    { type: String, required: true },
    fileName:   { type: String, required: true },
    fileSize:   { type: Number, required: true },
    fileType:   { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("EvidenceDocument", evidenceDocumentSchema);
