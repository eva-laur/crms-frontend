import Course from "./courses.model.js";

// Check if course code already exists
export const getCourseByCodeService = async (courseCode) => {
  return await Course.findOne({ courseCode });
};

// Create a new course
export const createCourseService = async ({ courseCode, title, description, lecturer, semester, academicYear }) => {
  const course = await Course.create({
    courseCode,
    title,
    description,
    lecturer,
    semester,
    academicYear,
  });

  return course;
};

// Get all courses
export const getCoursesService = async () => {
  const courses = await Course.find()
    .populate("lecturer", "name email role")
    .populate("students", "name email matricule")
    .sort({ createdAt: -1 });

  return courses;
};

// Get a single course by ID
export const getCourseByIdService = async (courseId) => {
  const course = await Course.findById(courseId)
    .populate("lecturer", "name email role")
    .populate("students", "name email matricule");

  return course;
};

// Enroll a student into a course
export const enrollStudentService = async (courseId, studentId) => {
  const course = await Course.findById(courseId);
  if (!course) return null;

  if (course.students.includes(studentId)) {
    return { alreadyEnrolled: true, course };
  }

  course.students.push(studentId);
  await course.save();

  return { alreadyEnrolled: false, course };
};

// Remove a student from a course
export const unenrollStudentService = async (courseId, studentId) => {
  const course = await Course.findById(courseId);
  if (!course) return null;

  course.students = course.students.filter(
    (id) => id.toString() !== studentId.toString()
  );
  await course.save();

  return course;
};

// Update course details
export const updateCourseService = async (courseId, updates) => {
  const course = await Course.findByIdAndUpdate(
    courseId,
    updates,
    { new: true, runValidators: true }
  );

  return course;
};

// Delete a course
export const deleteCourseService = async (courseId) => {
  return await Course.findByIdAndDelete(courseId);
};
