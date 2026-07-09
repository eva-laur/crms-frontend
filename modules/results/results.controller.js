import {
  getResultByStudentAndCourseService,
  createResultService,
  addAssessmentService,
  updateAssessmentService,
  getResultsService,
  getResultByIdService,
  getResultsByStudentService,
  getResultsByCourseService,
} from "./results.service.js";

// POST /api/results
export const createResult = async (req, res) => {
  try {
    const { student, course } = req.body;

    const existing = await getResultByStudentAndCourseService(student, course);
    if (existing) {
      return res.status(400).json({ message: "Result record already exists for this student and course" });
    }

    const result = await createResultService({
      student,
      course,
      lecturerId: req.user._id,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/results/:id/assessment
export const addAssessmentResult = async (req, res) => {
  try {
    const { title, type, score, totalMarks } = req.body;

    const result = await addAssessmentService(req.params.id, { title, type, score, totalMarks });

    if (!result) {
      return res.status(404).json({ message: "Result record not found" });
    }

    res.status(200).json({ message: "Assessment added successfully", result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/results/:id/assessment/:assessmentId — edit a previously-entered
// assessment (e.g. correcting a CA mark) instead of appending a duplicate.
export const updateAssessmentResult = async (req, res) => {
  try {
    const { title, type, score, totalMarks } = req.body;

    const result = await updateAssessmentService(req.params.id, req.params.assessmentId, { title, type, score, totalMarks });

    if (!result) {
      return res.status(404).json({ message: "Result or assessment not found" });
    }

    res.status(200).json({ message: "Assessment updated successfully", result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/results
export const getResults = async (req, res) => {
  try {
    // Without this, any student calling GET /results saw every student's
    // grades platform-wide — same class of bug as the earlier bookings
    // scoping issue, just on more sensitive data. Students see only their
    // own results; faculty see only results for courses they lecture;
    // admin/managers are unrestricted.
    let filter = {};
    if (req.user.role === "student") filter = { student: req.user._id };
    else if (req.user.role === "faculty") filter = { lecturer: req.user._id };

    const results = await getResultsService(filter);
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/results/:id
export const getResultById = async (req, res) => {
  try {
    const result = await getResultByIdService(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/results/student/:studentId
export const getResultsByStudent = async (req, res) => {
  try {
    const results = await getResultsByStudentService(req.params.studentId);
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/results/course/:courseId
export const getResultsByCourse = async (req, res) => {
  try {
    const results = await getResultsByCourseService(req.params.courseId);
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
