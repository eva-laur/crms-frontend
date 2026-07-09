import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    actor:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorRole:{ type: String, default: "guest" },
    action:   { type: String, required: true },  // e.g. "CREATE_BOOKING"
    module:   { type: String, required: true },  // e.g. "bookings"
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    details:  { type: mongoose.Schema.Types.Mixed, default: null },
    ip:       { type: String, default: null },
    status:   { type: Number, default: 200 },    // HTTP status code
  },
  { timestamps: true }
);

// Auto-delete logs older than 90 days
auditSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default mongoose.model("AuditLog", auditSchema);
