import {
  createAttendanceService,
  markAttendanceService,
  getAttendanceService,
  getAttendanceByIdService,
  getAttendanceByCourseService,
  getAttendanceByStudentService,
} from "./attendance.service.js";

// POST /api/attendance
export const createAttendance = async (req, res) => {
  try {
    const { course } = req.body;

    const attendance = await createAttendanceService({
      course,
      lecturerId: req.user._id,
    });

    res.status(201).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/attendance/:id/mark
export const markAttendance = async (req, res) => {
  try {
    const { student, status } = req.body;

    const attendance = await markAttendanceService(req.params.id, { student, status });

    if (!attendance) {
      return res.status(404).json({ message: "Attendance session not found" });
    }

    res.status(200).json({ message: "Attendance marked successfully", attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/attendance
export const getAttendance = async (req, res) => {
  try {
    // Same fix as the earlier results-scoping bug: don't return every
    // session's full roster (who was present/absent) to every role with
    // attendance:view. Students see only sessions they appear in; faculty
    // see only sessions for their own courses; admin/managers unrestricted.
    let filter = {};
    if (req.user.role === "student") filter = { "records.student": req.user._id };
    else if (req.user.role === "faculty") filter = { lecturer: req.user._id };

    const attendance = await getAttendanceService(filter);
    res.status(200).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/attendance/:id
export const getAttendanceById = async (req, res) => {
  try {
    const attendance = await getAttendanceByIdService(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: "Attendance session not found" });
    }

    res.status(200).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/attendance/course/:courseId
export const getAttendanceByCourse = async (req, res) => {
  try {
    const attendance = await getAttendanceByCourseService(req.params.courseId);
    res.status(200).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/attendance/student/:studentId
export const getAttendanceByStudent = async (req, res) => {
  try {
    const attendance = await getAttendanceByStudentService(req.params.studentId);
    res.status(200).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
