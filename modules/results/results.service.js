import Result from "./results.model.js";

// Helper: calculate final score and assign grade from assessments array
const computeGrade = (assessments) => {
  const totalScore    = assessments.reduce((sum, a) => sum + a.score,      0);
  const totalPossible = assessments.reduce((sum, a) => sum + a.totalMarks, 0);

  if (totalPossible === 0) return { finalScore: 0, grade: "N/A" };

  const finalScore = (totalScore / totalPossible) * 100;

  let grade;
  if      (finalScore >= 80) grade = "A";
  else if (finalScore >= 70) grade = "B";
  else if (finalScore >= 60) grade = "C";
  else if (finalScore >= 50) grade = "D";
  else                       grade = "F";

  return { finalScore: parseFloat(finalScore.toFixed(2)), grade };
};

// Check if a result record already exists for a student/course pair
export const getResultByStudentAndCourseService = async (studentId, courseId) => {
  return await Result.findOne({ student: studentId, course: courseId });
};

// Create a new result record (empty assessments to start)
export const createResultService = async ({ student, course, lecturerId }) => {
  const result = await Result.create({
    student,
    course,
    lecturer: lecturerId,
  });

  return result;
};

// Add an assessment and recalculate final score + grade
export const addAssessmentService = async (resultId, { title, type, score, totalMarks }) => {
  const result = await Result.findById(resultId);
  if (!result) return null;

  result.assessments.push({ title, type, score, totalMarks });

  const { finalScore, grade } = computeGrade(result.assessments);
  result.finalScore = finalScore;
  result.grade      = grade;

  await result.save();
  return result;
};

// Update an existing assessment in place (e.g. editing a previously-entered
// CA mark) and recalculate final score + grade. Unlike addAssessmentService
// (which always pushes a new subdocument), this finds the assessment by its
// own _id via Mongoose's array .id() helper and patches only the fields
// provided, so a partial `{ score }` body doesn't clobber title/type/totalMarks.
export const updateAssessmentService = async (resultId, assessmentId, { title, type, score, totalMarks }) => {
  const result = await Result.findById(resultId);
  if (!result) return null;

  const assessment = result.assessments.id(assessmentId);
  if (!assessment) return null;

  if (title !== undefined) assessment.title = title;
  if (type !== undefined) assessment.type = type;
  if (score !== undefined) assessment.score = score;
  if (totalMarks !== undefined) assessment.totalMarks = totalMarks;

  const { finalScore, grade } = computeGrade(result.assessments);
  result.finalScore = finalScore;
  result.grade      = grade;

  await result.save();
  return result;
};

// Get results (optionally filtered — see getResults controller, which scopes
// this to the caller for student/faculty so grades aren't visible platform-wide)
export const getResultsService = async (filter = {}) => {
  return await Result.find(filter)
    .populate("student",  "name email")
    .populate("course")
    .populate("lecturer", "name email")
    .sort({ createdAt: -1 });
};

// Get a single result by ID
export const getResultByIdService = async (resultId) => {
  return await Result.findById(resultId)
    .populate("student",  "name email")
    .populate("course")
    .populate("lecturer", "name email");
};

// Get all results for a specific student
export const getResultsByStudentService = async (studentId) => {
  return await Result.find({ student: studentId })
    .populate("course")
    .populate("lecturer", "name email")
    .sort({ createdAt: -1 });
};

// Get all results for a specific course
export const getResultsByCourseService = async (courseId) => {
  return await Result.find({ course: courseId })
    .populate("student",  "name email")
    .populate("lecturer", "name email")
    .sort({ createdAt: -1 });
};
