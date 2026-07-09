import mongoose from "mongoose";

const topicSchema = new mongoose.Schema({
  title: String,

  description: String,

  dateCovered: {
    type: Date,
    default: Date.now,
  },

  status: {
    type: String,
    enum: ["planned", "ongoing", "completed"],
    default: "completed",
  },
});

const assessmentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["quiz", "test", "assignment", "exam"],
  },

  title: String,

  date: Date,

  description: String,
});

const courseProgressSchema = new mongoose.Schema(
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

    topics: [topicSchema],

    assessments: [assessmentSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "CourseProgress",
  courseProgressSchema
);