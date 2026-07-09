import mongoose from "mongoose";
import { ALL_ROLES, ROLES } from "../../shared/constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.STUDENT,
    },

    // Student/staff ID shown throughout the frontend (e.g. "IUC-2024-STU-0421").
    // Required at registration and used to log in (see users.service.js —
    // loginUserService authenticates by matricule, not email).
    matricule: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
