import CourseProgress from "./courseProgress.model.js";

// Check if a progress record already exists for a course
export const getProgressByCourseService = async (courseId) => {
  return await CourseProgress.findOne({ course: courseId });
};

// Create a new course progress record
export const createCourseProgressService = async ({ course, lecturerId }) => {
  return await CourseProgress.create({ course, lecturer: lecturerId });
};

// Get all course progress records
export const getCourseProgressService = async () => {
  return await CourseProgress.find()
    .populate("course")
    .populate("lecturer", "name email")
    .sort({ createdAt: -1 });
};

// Get a single course progress record by ID
export const getCourseProgressByIdService = async (progressId) => {
  return await CourseProgress.findById(progressId)
    .populate("course")
    .populate("lecturer", "name email");
};

// Add a topic to a course progress record
export const addTopicService = async (progressId, { title, description, status }) => {
  const progress = await CourseProgress.findById(progressId);
  if (!progress) return null;

  progress.topics.push({ title, description, status });
  await progress.save();
  return progress;
};

// Add a planned assessment to a course progress record
export const addAssessmentService = async (progressId, { type, title, date, description }) => {
  const progress = await CourseProgress.findById(progressId);
  if (!progress) return null;

  progress.assessments.push({ type, title, date, description });
  await progress.save();
  return progress;
};

// Update topic status (planned → ongoing → completed)
export const updateTopicStatusService = async (progressId, topicId, status) => {
  const progress = await CourseProgress.findById(progressId);
  if (!progress) return null;

  const topic = progress.topics.id(topicId);
  if (!topic) return { notFound: "topic" };

  topic.status = status;
  await progress.save();
  return progress;
};
