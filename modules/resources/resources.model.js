import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    location: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },

    // What kind of resource — drives checkout rules
    type: {
      type: String,
      enum: ["equipment", "lab", "book", "general"],
      required: true,
      default: "general",
    },

    // Finer category label (e.g. "projector", "microscope", "novel")
    category: { type: String, default: null },

    // ── Book-specific fields ────────────────────────────────────────────────
    isbn:            { type: String,  default: null },
    author:          { type: String,  default: null },
    totalCopies:     { type: Number,  default: 1 },
    availableCopies: { type: Number,  default: 1 },

    // ── Extra display fields used by the richer manager UIs (IT equipment /
    // library catalog pages). All optional — not used by the core booking
    // logic, just carried through so those pages have somewhere to read/write
    // brand, academic level, etc. without another migration later.
    brand:      { type: String, default: null }, // e.g. "Sony", "Dell" (equipment)
    speciality: { type: String, default: null }, // e.g. "Computer Science" (book)
    level:      { type: String, default: null }, // e.g. "L1".."PhD" (book)
    assetTag:   { type: String, default: null }, // e.g. "AST-2087" (equipment)
    condition:  { type: String, enum: ["Excellent", "Good", "Worn", "Faulty"], default: "Excellent" }, // equipment

    // ── Status ──────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["available", "unavailable", "under_maintenance"],
      default: "available",
    },

    // Maintenance note (visible to users when status = under_maintenance)
    maintenanceNote: { type: String, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Resource", resourceSchema);
