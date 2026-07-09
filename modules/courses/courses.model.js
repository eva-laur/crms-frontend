import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
    },

    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    semester: {
      type: String,
      required: true,
    },

    academicYear: {
      type: String,
      required: true,
    },

    // Class level — e.g. "L1", "L2", "L3", "M1", "M2", "PhD"
    classLevel: {
      type: String,
      default: null,
    },

    // Academic speciality / department — e.g. "Computer Science", "Electrical Engineering"
    specialty: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Course", courseSchema);