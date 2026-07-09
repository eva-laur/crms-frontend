import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/database.js";

import Logbook from "../modules/logbooks/logbooks.model.js";
import CourseProgress from "../modules/course-progress/courseProgress.model.js";
import Result from "../modules/results/results.model.js";
import Attendance from "../modules/attendance/attendance.model.js";

import AcademicRecord from "../modules/academic-records/academicRecord.model.js";

const migrationErrors = [];

const migrate = async () => {
  await connectDB();

  const logbooks = await Logbook.find();

  for (const logbook of logbooks) {
    try {
      const progress =
        await CourseProgress.findOne({
          course: logbook.course,
        });

      const attendances =
        await Attendance.find({
          course: logbook.course,
        });

      const results =
        await Result.find({
          course: logbook.course,
        });

      const academicRecord =
        new AcademicRecord({
          course: logbook.course,
          lecturer: logbook.lecturer,
          academicYear:
            logbook.academicYear,
          semester: logbook.semester,

          topics: [
            ...(progress?.topics || []),
          ],

          sessions:
            logbook.sessions || [],

          attendance:
            attendances.map((a) => ({
              date: a.date,
              records: a.records,
            })),

          assessments: [
            ...(logbook.assignments || []),
            ...(logbook.assessments || []),
          ],

          finalResults: results.map(
            (r) => ({
              student: r.student,
              finalScore: r.finalScore,
              grade: r.grade,
            })
          ),
        });

      await academicRecord.save();
    } catch (error) {
      migrationErrors.push({
        logbookId: logbook._id,
        error: error.message,
      });
    }
  }

  console.log(
    "Migration completed"
  );

  if (migrationErrors.length) {
    console.log(
      "Migration errors:"
    );
    console.log(migrationErrors);
  }

  process.exit();
};

migrate();