import Result from "../results/results.model.js";
import Attendance from "../attendance/attendance.model.js";
import {getUtilizationByResource, getUtilizationByResourceType,} from "./resourceUtilizationReport.js";
// Generate a full academic report for a single student
export const generateStudentReportService = async (studentId) => {
  // Fetch results and attendance in parallel
  const [results, attendanceSessions] = await Promise.all([
    Result.find({ student: studentId }).populate("course"),
    Attendance.find({ "records.student": studentId }).populate("course"),
  ]);

  // Average score across all courses
  const averageScore =
    results.length > 0
      ? parseFloat(
          (results.reduce((sum, r) => sum + r.finalScore, 0) / results.length).toFixed(2)
        )
      : 0;

  // Attendance percentage
  let totalSessions = attendanceSessions.length;
  let presentCount  = 0;

  attendanceSessions.forEach((session) => {
    const record = session.records.find(
      (r) => r.student.toString() === studentId.toString()
    );
    if (record && record.status === "present") presentCount++;
  });

  const attendancePercentage =
    totalSessions > 0
      ? parseFloat(((presentCount / totalSessions) * 100).toFixed(2))
      : 0;

  return {
    studentId,
    averageScore,
    attendancePercentage,
    totalSessions,
    presentCount,
    results,
  };
};

// Generate a summary report for a whole course
export const generateCourseReportService = async (courseId) => {
  const [results, attendanceSessions] = await Promise.all([
    Result.find({ course: courseId }).populate("student", "name email"),
    Attendance.find({ course: courseId }).populate("records.student", "name email"),
  ]);

  // Per-student breakdown
  const studentMap = {};

  results.forEach((r) => {
    const id = r.student._id.toString();
    if (!studentMap[id]) {
      studentMap[id] = {
        student: r.student,
        finalScore: r.finalScore,
        grade: r.grade,
        attendancePercentage: 0,
      };
    }
  });

  // Attendance per student
  attendanceSessions.forEach((session) => {
    session.records.forEach((record) => {
      const id = record.student._id
        ? record.student._id.toString()
        : record.student.toString();

      if (studentMap[id]) {
        studentMap[id]._totalSessions  = (studentMap[id]._totalSessions  || 0) + 1;
        if (record.status === "present") {
          studentMap[id]._presentCount = (studentMap[id]._presentCount || 0) + 1;
        }
      }
    });
  });

  // Resolve attendance percentages
  Object.values(studentMap).forEach((entry) => {
    const total   = entry._totalSessions  || 0;
    const present = entry._presentCount || 0;
    entry.attendancePercentage = total > 0
      ? parseFloat(((present / total) * 100).toFixed(2))
      : 0;
    delete entry._totalSessions;
    delete entry._presentCount;
  });

  // Course-level averages
  const students     = Object.values(studentMap);
  const courseAverage =
    students.length > 0
      ? parseFloat(
          (students.reduce((sum, s) => sum + s.finalScore, 0) / students.length).toFixed(2)
        )
      : 0;

  return {
    courseId,
    totalStudents: students.length,
    totalSessions: attendanceSessions.length,
    courseAverage,
    students,
  };
};
