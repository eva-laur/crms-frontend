import mongoose from "mongoose";

const attendanceRecordSchema =
  new mongoose.Schema({
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["present", "absent", "late"],
      required: true,
    },
  });

const attendanceSchema =
  new mongoose.Schema(
    {
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
      },

      lecturer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      date: {
        type: Date,
        default: Date.now,
      },

      records: [attendanceRecordSchema],
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "Attendance",
  attendanceSchema
);