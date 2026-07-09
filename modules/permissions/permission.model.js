import mongoose from "mongoose";
import { ALL_ROLES } from "../../shared/constants/roles.js";

/*
Tradeoff:
Unique compound index prevents duplicate permission rows.
Each row describes one role's permission for one module/action.
*/

const permissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ALL_ROLES,
      required: true,
    },

    module: {
      type: String,
      required: true,
    },

    action: {
      type: String,
      required: true,
    },

    allowed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

permissionSchema.index(
  { role: 1, module: 1, action: 1 },
  { unique: true }
);

export default mongoose.model("Permission", permissionSchema);
