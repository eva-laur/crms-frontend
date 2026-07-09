import * as svc from "./logbooks.service.js";

const handle = (fn) => async (req, res) => {
  try {
    const result = await fn(req, res);
    if (result === null) return res.status(404).json({ message: "Not found" });
    res.status(result._isNew ? 201 : 200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/logbooks
export const createLogbook = async (req, res) => {
  try {
    const { course, academicYear, semester } = req.body;
    const logbook = await svc.createLogbookService({ course, lecturerId: req.user._id, academicYear, semester });
    res.status(201).json(logbook);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

// GET /api/logbooks
export const getLogbooks = async (req, res) => {
  try { res.status(200).json(await svc.getLogbooksService()); }
  catch (error) { res.status(500).json({ message: error.message }); }
};

// GET /api/logbooks/:id
export const getLogbookById = async (req, res) => {
  try {
    const lb = await svc.getLogbookByIdService(req.params.id);
    if (!lb) return res.status(404).json({ message: "Logbook not found" });
    res.status(200).json(lb);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// GET /api/logbooks/course/:courseId
export const getLogbookByCourse = async (req, res) => {
  try { res.status(200).json(await svc.getLogbookByCourseService(req.params.courseId)); }
  catch (error) { res.status(500).json({ message: error.message }); }
};

// GET /api/logbooks/my — lecturer sees their own
export const getMyLogbooks = async (req, res) => {
  try { res.status(200).json(await svc.getLogbooksByLecturerService(req.user._id)); }
  catch (error) { res.status(500).json({ message: error.message }); }
};

// GET /api/logbooks/student-view/:courseId
export const getStudentView = async (req, res) => {
  try {
    const view = await svc.getStudentLogbookViewService(req.params.courseId, req.user._id.toString());
    if (!view) return res.status(404).json({ message: "Logbook not found for this course" });
    res.status(200).json(view);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ─── OUTLINE ──────────────────────────────────────────────────────────────────
export const addOutlineTopic = async (req, res) => {
  try {
    const lb = await svc.addOutlineTopicService(req.params.id, req.body);
    if (!lb) return res.status(404).json({ message: "Logbook not found" });
    res.status(200).json(lb);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const updateOutlineStatus = async (req, res) => {
  try {
    const lb = await svc.updateOutlineTopicStatusService(req.params.id, req.params.topicId, req.body.status);
    if (!lb) return res.status(404).json({ message: "Logbook or topic not found" });
    res.status(200).json(lb);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const deleteOutlineTopic = async (req, res) => {
  try {
    const lb = await svc.deleteOutlineTopicService(req.params.id, req.params.topicId);
    if (!lb) return res.status(404).json({ message: "Logbook or topic not found" });
    res.status(200).json(lb);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ─── SESSIONS ─────────────────────────────────────────────────────────────────
export const addSession = async (req, res) => {
  try {
    const lb = await svc.addSessionService(req.params.id, req.body);
    if (!lb) return res.status(404).json({ message: "Logbook not found" });
    res.status(200).json(lb);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ─── ASSIGNMENTS ──────────────────────────────────────────────────────────────
export const addAssignment = async (req, res) => {
  try {
    const lb = await svc.addAssignmentService(req.params.id, req.body);
    if (!lb) return res.status(404).json({ message: "Logbook not found" });
    res.status(200).json(lb);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const recordAssignmentMark = async (req, res) => {
  try {
    const lb = await svc.recordAssignmentMarkService(req.params.id, req.params.assignmentId, req.body);
    if (!lb) return res.status(404).json({ message: "Logbook or assignment not found" });
    res.status(200).json(lb);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ─── ASSESSMENTS ──────────────────────────────────────────────────────────────
export const addAssessment = async (req, res) => {
  try {
    const lb = await svc.addAssessmentService(req.params.id, req.body);
    if (!lb) return res.status(404).json({ message: "Logbook not found" });
    res.status(200).json(lb);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const recordAssessmentScore = async (req, res) => {
  try {
    const lb = await svc.recordAssessmentScoreService(req.params.id, req.params.assessmentId, req.body);
    if (!lb) return res.status(404).json({ message: "Logbook or assessment not found" });
    res.status(200).json(lb);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ─── DEADLINES ────────────────────────────────────────────────────────────────
export const addDeadline = async (req, res) => {
  try {
    const lb = await svc.addDeadlineService(req.params.id, req.body);
    if (!lb) return res.status(404).json({ message: "Logbook not found" });
    res.status(200).json(lb);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const deleteDeadline = async (req, res) => {
  try {
    const lb = await svc.deleteDeadlineService(req.params.id, req.params.deadlineId);
    if (!lb) return res.status(404).json({ message: "Logbook or deadline not found" });
    res.status(200).json(lb);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
