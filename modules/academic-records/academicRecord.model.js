import mongoose from "mongoose";

/*
Tradeoff:
Single academic record per course + semester improves consistency
and removes duplicated assessment/topic data. Slightly larger document,
but easier reporting and migration.
*/

const topicSchema = new mongoose.Schema({
  title: String,
  description: String,
  week: Number,
  status: {
    type: String,
    enum: ["planned", "ongoing", "completed"],
    default: "planned",
  },
  dateCovered: Date,
});

const sessionSchema = new mongoose.Schema({
  date: Date,
  topicCovered: String,
  description: String,
  hoursDelivered: Number,
  remarks: String,
});

const attendanceSchema = new mongoose.Schema({
  date: Date,
  records: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      status: {
        type: String,
        enum: ["present", "absent", "late"],
      },
    },
  ],
});

const assessmentSchema = new mongoose.Schema({
  title: String,

  type: {
    type: String,
    enum: [
      "quiz",
      "test",
      "assignment",
      "exam",
      "mid-term",
      "ca",
    ],
  },

  date: Date,
  dueDate: Date,
  description: String,
  totalMarks: Number,

  submissions: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      marksObtained: Number,
      remarks: String,
      submittedAt: Date,
    },
  ],
});

const academicRecordSchema =
  new mongoose.Schema(
    {
      course: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
      },

      lecturer: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      academicYear: String,
      semester: String,

      topics: [topicSchema],
      sessions: [sessionSchema],
      attendance: [attendanceSchema],
      assessments: [assessmentSchema],

      finalResults: [
        {
          student: {
            type:
              mongoose.Schema.Types.ObjectId,
            ref: "User",
          },

          finalScore: Number,
          grade: String,
        },
      ],
    },
    { timestamps: true }
  );

export default mongoose.model(
  "AcademicRecord",
  academicRecordSchema
);