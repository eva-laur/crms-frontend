import Logbook from "./logbooks.model.js";

const populate = (query) =>
  query
    .populate("course")
    .populate("lecturer", "name email")
    .populate("assignments.submissions.student", "name email")
    .populate("assessments.scores.student", "name email");

// Create a new logbook for a course
export const createLogbookService = async ({ course, lecturerId, academicYear, semester }) => {
  const existing = await Logbook.findOne({ course, academicYear, semester });
  if (existing) throw new Error("Logbook already exists for this course, year and semester");

  return await Logbook.create({ course, lecturer: lecturerId, academicYear, semester });
};

// Get all logbooks
export const getLogbooksService = async () =>
  await populate(Logbook.find().sort({ createdAt: -1 }));

// Get logbook by ID
export const getLogbookByIdService = async (id) =>
  await populate(Logbook.findById(id));

// Get logbooks for a specific course
export const getLogbookByCourseService = async (courseId) =>
  await populate(Logbook.find({ course: courseId }));

// Get logbooks by lecturer
export const getLogbooksByLecturerService = async (lecturerId) =>
  await populate(Logbook.find({ lecturer: lecturerId }));

// ─── OUTLINE ──────────────────────────────────────────────────────────────────

export const addOutlineTopicService = async (logbookId, { week, title, description }) => {
  const lb = await Logbook.findById(logbookId);
  if (!lb) return null;
  lb.outline.push({ week, title, description });
  await lb.save();
  return lb;
};

export const updateOutlineTopicStatusService = async (logbookId, topicId, status) => {
  const lb = await Logbook.findById(logbookId);
  if (!lb) return null;
  const topic = lb.outline.id(topicId);
  if (!topic) return null;
  topic.status = status;
  await lb.save();
  return lb;
};

export const deleteOutlineTopicService = async (logbookId, topicId) => {
  const lb = await Logbook.findById(logbookId);
  if (!lb) return null;
  lb.outline.pull({ _id: topicId });
  await lb.save();
  return lb;
};

// ─── SESSIONS ─────────────────────────────────────────────────────────────────

export const addSessionService = async (logbookId, { date, topicCovered, description, hoursDelivered, remarks }) => {
  const lb = await Logbook.findById(logbookId);
  if (!lb) return null;
  lb.sessions.push({ date, topicCovered, description, hoursDelivered, remarks });
  await lb.save();
  return lb;
};

// ─── ASSIGNMENTS ──────────────────────────────────────────────────────────────

export const addAssignmentService = async (logbookId, { title, description, dueDate, totalMarks }) => {
  const lb = await Logbook.findById(logbookId);
  if (!lb) return null;
  lb.assignments.push({ title, description, dueDate, totalMarks });
  await lb.save();
  return lb;
};

export const recordAssignmentMarkService = async (logbookId, assignmentId, { student, marksObtained, remarks }) => {
  const lb = await Logbook.findById(logbookId);
  if (!lb) return null;
  const assignment = lb.assignments.id(assignmentId);
  if (!assignment) return null;

  // Update if already submitted, else push
  const existing = assignment.submissions.find(s => s.student.toString() === student);
  if (existing) {
    existing.marksObtained = marksObtained;
    existing.remarks = remarks;
  } else {
    assignment.submissions.push({ student, marksObtained, remarks });
  }
  await lb.save();
  return lb;
};

// ─── ASSESSMENTS ──────────────────────────────────────────────────────────────

export const addAssessmentService = async (logbookId, { title, type, date, totalMarks }) => {
  const lb = await Logbook.findById(logbookId);
  if (!lb) return null;
  lb.assessments.push({ title, type, date, totalMarks });
  await lb.save();
  return lb;
};

export const recordAssessmentScoreService = async (logbookId, assessmentId, { student, marksObtained }) => {
  const lb = await Logbook.findById(logbookId);
  if (!lb) return null;
  const assessment = lb.assessments.id(assessmentId);
  if (!assessment) return null;

  const existing = assessment.scores.find(s => s.student.toString() === student);
  if (existing) {
    existing.marksObtained = marksObtained;
  } else {
    assessment.scores.push({ student, marksObtained });
  }
  await lb.save();
  return lb;
};

// ─── DEADLINES ────────────────────────────────────────────────────────────────

export const addDeadlineService = async (logbookId, { title, type, date, description }) => {
  const lb = await Logbook.findById(logbookId);
  if (!lb) return null;
  lb.deadlines.push({ title, type, date, description });
  await lb.save();
  return lb;
};

export const deleteDeadlineService = async (logbookId, deadlineId) => {
  const lb = await Logbook.findById(logbookId);
  if (!lb) return null;
  lb.deadlines.pull({ _id: deadlineId });
  await lb.save();
  return lb;
};

// ─── STUDENT VIEW ─────────────────────────────────────────────────────────────
// Returns only the student's own marks across all assignments + assessments

export const getStudentLogbookViewService = async (courseId, studentId) => {
  const lb = await populate(Logbook.findOne({ course: courseId }));
  if (!lb) return null;

  const myAssignments = lb.assignments.map((a) => ({
    title: a.title,
    dueDate: a.dueDate,
    totalMarks: a.totalMarks,
    myMark: a.submissions.find(s => s.student?._id?.toString() === studentId)?.marksObtained ?? "Not graded",
  }));

  const myAssessments = lb.assessments.map((a) => ({
    title: a.title,
    type: a.type,
    date: a.date,
    totalMarks: a.totalMarks,
    myMark: a.scores.find(s => s.student?._id?.toString() === studentId)?.marksObtained ?? "Not graded",
  }));

  return {
    course: lb.course,
    lecturer: lb.lecturer,
    academicYear: lb.academicYear,
    semester: lb.semester,
    outline: lb.outline,
    sessions: lb.sessions,
    deadlines: lb.deadlines,
    myAssignments,
    myAssessments,
  };
};
