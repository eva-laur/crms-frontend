import {
  getProgressByCourseService,
  createCourseProgressService,
  getCourseProgressService,
  getCourseProgressByIdService,
  addTopicService,
  addAssessmentService,
  updateTopicStatusService,
} from "./courseProgress.service.js";

// POST /api/courseProgress
export const createCourseProgress = async (req, res) => {
  try {
    const { course } = req.body;

    const existing = await getProgressByCourseService(course);
    if (existing) {
      return res.status(400).json({ message: "Course progress already exists" });
    }

    const progress = await createCourseProgressService({
      course,
      lecturerId: req.user._id,
    });

    res.status(201).json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/courseProgress
export const getCourseProgress = async (req, res) => {
  try {
    const progress = await getCourseProgressService();
    res.status(200).json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/courseProgress/:id
export const getCourseProgressById = async (req, res) => {
  try {
    const progress = await getCourseProgressByIdService(req.params.id);
    if (!progress) {
      return res.status(404).json({ message: "Course progress not found" });
    }
    res.status(200).json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/courseProgress/:id/topic
export const addTopic = async (req, res) => {
  try {
    const { title, description, status } = req.body;

    const progress = await addTopicService(req.params.id, { title, description, status });
    if (!progress) {
      return res.status(404).json({ message: "Course progress not found" });
    }

    res.status(200).json({ message: "Topic added successfully", progress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/courseProgress/:id/assessment
export const addAssessment = async (req, res) => {
  try {
    const { type, title, date, description } = req.body;

    const progress = await addAssessmentService(req.params.id, { type, title, date, description });
    if (!progress) {
      return res.status(404).json({ message: "Course progress not found" });
    }

    res.status(200).json({ message: "Assessment added successfully", progress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/courseProgress/:id/topic/:topicId/status
export const updateTopicStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["planned", "ongoing", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const result = await updateTopicStatusService(req.params.id, req.params.topicId, status);

    if (!result) return res.status(404).json({ message: "Course progress not found" });
    if (result.notFound) return res.status(404).json({ message: "Topic not found" });

    res.status(200).json({ message: "Topic status updated", progress: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
