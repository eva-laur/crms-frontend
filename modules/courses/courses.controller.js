import {
  getCourseByCodeService,
  createCourseService,
  getCoursesService,
  getCourseByIdService,
  enrollStudentService,
  unenrollStudentService,
  updateCourseService,
  deleteCourseService,
} from "./courses.service.js";
import { ROLES } from "../../shared/constants/roles.js";

// Ownership guard: faculty can only modify their own courses; admin can modify any.
const assertOwner = async (courseId, user) => {
  if (user.role === ROLES.ADMIN) return null; // unrestricted
  const course = await getCourseByIdService(courseId);
  if (!course) return "Course not found";
  if (course.lecturer._id.toString() !== user._id.toString()) {
    return "You can only modify courses you teach";
  }
  return null;
};

// POST /api/courses
export const createCourse = async (req, res) => {
  try {
    const { courseCode, title, description, semester, academicYear } = req.body;
    // Faculty always become the lecturer of courses they create.
    // Admin can pass a lecturer ID explicitly; if not provided, defaults to themselves.
    const lecturer = req.user.role === ROLES.ADMIN && req.body.lecturer
      ? req.body.lecturer
      : req.user._id;

    const existing = await getCourseByCodeService(courseCode);
    if (existing) return res.status(400).json({ message: "Course already exists" });

    const course = await createCourseService({ courseCode, title, description, lecturer, semester, academicYear });
    res.status(201).json(course);
  } catch (error) { console.error(error); res.status(500).json({ message: error.message }); }
};

// GET /api/courses
export const getCourses = async (req, res) => {
  try { res.status(200).json(await getCoursesService()); }
  catch (error) { console.error(error); res.status(500).json({ message: error.message }); }
};

// GET /api/courses/:id
export const getCourseById = async (req, res) => {
  try {
    const course = await getCourseByIdService(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(200).json(course);
  } catch (error) { console.error(error); res.status(500).json({ message: error.message }); }
};

// PUT /api/courses/:courseId/enroll
export const enrollStudent = async (req, res) => {
  try {
    const err = await assertOwner(req.params.courseId, req.user);
    if (err === "Course not found") return res.status(404).json({ message: err });
    if (err) return res.status(403).json({ message: err });

    const { studentId } = req.body;
    const result = await enrollStudentService(req.params.courseId, studentId);
    if (!result) return res.status(404).json({ message: "Course not found" });
    if (result.alreadyEnrolled) return res.status(400).json({ message: "Student already enrolled" });
    res.status(200).json({ message: "Student enrolled successfully", course: result.course });
  } catch (error) { console.error(error); res.status(500).json({ message: error.message }); }
};

// PUT /api/courses/:courseId/unenroll
export const unenrollStudent = async (req, res) => {
  try {
    const err = await assertOwner(req.params.courseId, req.user);
    if (err === "Course not found") return res.status(404).json({ message: err });
    if (err) return res.status(403).json({ message: err });

    const { studentId } = req.body;
    const course = await unenrollStudentService(req.params.courseId, studentId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(200).json({ message: "Student unenrolled successfully", course });
  } catch (error) { console.error(error); res.status(500).json({ message: error.message }); }
};

// PUT /api/courses/:id
export const updateCourse = async (req, res) => {
  try {
    const err = await assertOwner(req.params.id, req.user);
    if (err === "Course not found") return res.status(404).json({ message: err });
    if (err) return res.status(403).json({ message: err });

    const course = await updateCourseService(req.params.id, req.body);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(200).json(course);
  } catch (error) { console.error(error); res.status(500).json({ message: error.message }); }
};

// DELETE /api/courses/:id
export const deleteCourse = async (req, res) => {
  try {
    const err = await assertOwner(req.params.id, req.user);
    if (err === "Course not found") return res.status(404).json({ message: err });
    if (err) return res.status(403).json({ message: err });

    const course = await deleteCourseService(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) { console.error(error); res.status(500).json({ message: error.message }); }
};
