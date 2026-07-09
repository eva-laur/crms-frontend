import mongoose from "mongoose";

const logbookSchema = new mongoose.Schema(
  {
    course:    { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    lecturer:  { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true },
    academicYear: { type: String, required: true },
    semester:  { type: String, required: true },

    // Course outline — what SHOULD be covered (set at the start of semester)
    outline: [
      {
        week:        { type: Number, required: true },
        title:       { type: String, required: true },
        description: { type: String },
        status: {
          type: String,
          enum: ["pending", "covered", "partially_covered"],
          default: "pending",
        },
      },
    ],

    // Sessions — what WAS actually covered each day
    sessions: [
      {
        date:          { type: Date, required: true, default: Date.now },
        topicCovered:  { type: String, required: true },
        description:   { type: String },
        hoursDelivered:{ type: Number, default: 1 },
        remarks:       { type: String },
      },
    ],

    // Assignments — details + per-student marks
    assignments: [
      {
        title:       { type: String, required: true },
        description: { type: String },
        dueDate:     { type: Date,   required: true },
        totalMarks:  { type: Number, required: true },
        submissions: [
          {
            student:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            marksObtained:  { type: Number },
            remarks:        { type: String },
            submittedAt:    { type: Date, default: Date.now },
          },
        ],
      },
    ],

    // Internal assessments — quizzes, mid-terms, CA, tests
    assessments: [
      {
        title:      { type: String, required: true },
        type: {
          type: String,
          enum: ["quiz", "mid-term", "ca", "test", "exam"],
          required: true,
        },
        date:       { type: Date, required: true },
        totalMarks: { type: Number, required: true },
        scores: [
          {
            student:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            marksObtained: { type: Number },
          },
        ],
      },
    ],

    // Deadlines — exams, projects, submission dates
    deadlines: [
      {
        title:       { type: String, required: true },
        type: {
          type: String,
          enum: ["assignment", "exam", "project", "other"],
          default: "other",
        },
        date:        { type: Date, required: true },
        description: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Logbook", logbookSchema);
