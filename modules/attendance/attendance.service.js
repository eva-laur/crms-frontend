import Attendance from "./attendance.model.js";

// Create a new attendance session for a course
export const createAttendanceService = async ({ course, lecturerId }) => {
  const attendance = await Attendance.create({
    course,
    lecturer: lecturerId,
  });

  return attendance;
};

// Mark a student's attendance in a session
export const markAttendanceService = async (attendanceId, { student, status }) => {
  const attendance = await Attendance.findById(attendanceId);
  if (!attendance) return null;

  attendance.records.push({ student, status });
  await attendance.save();

  return attendance;
};

// Get all attendance sessions
export const getAttendanceService = async (filter = {}) => {
  const attendance = await Attendance.find(filter)
    .populate("course")
    .populate("lecturer", "name email")
    .populate("records.student", "name email")
    .sort({ date: -1 });

  return attendance;
};

// Get a single attendance session by ID
export const getAttendanceByIdService = async (attendanceId) => {
  const attendance = await Attendance.findById(attendanceId)
    .populate("course")
    .populate("lecturer", "name email")
    .populate("records.student", "name email");

  return attendance;
};

// Get all attendance sessions for a specific course
export const getAttendanceByCourseService = async (courseId) => {
  const attendance = await Attendance.find({ course: courseId })
    .populate("lecturer", "name email")
    .populate("records.student", "name email")
    .sort({ date: -1 });

  return attendance;
};

// Get all attendance records for a specific student
export const getAttendanceByStudentService = async (studentId) => {
  const attendance = await Attendance.find({
    "records.student": studentId,
  })
    .populate("course")
    .populate("lecturer", "name email")
    .sort({ date: -1 });

  return attendance;
};
