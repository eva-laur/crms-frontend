import mongoose from "mongoose";

const assessmentSchema =
  new mongoose.Schema({
    title: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "quiz",
        "test",
        "assignment",
        "exam",
      ],
      required: true,
    },

    score: {
      type: Number,
      required: true,
    },

    totalMarks: {
      type: Number,
      required: true,
    },
  });

const resultSchema =
  new mongoose.Schema(
    {
      student: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

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

      assessments: [assessmentSchema],

      finalScore: {
        type: Number,
        default: 0,
      },

      grade: {
        type: String,
        default: "N/A",
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "Result",
  resultSchema
);