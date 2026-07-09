import {
  generateStudentReportService,
  generateCourseReportService,
} from "./reports.service.js";
import {
  getUtilizationByResource,
  getUtilizationByResourceType,
} from "./resourceUtilizationReport.js";

// GET /api/reports/student/:studentId
export const getStudentReport = async (req, res) => {
  try {
    const report = await generateStudentReportService(req.params.studentId);
    res.status(200).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/course/:courseId
export const getCourseReport = async (req, res) => {
  try {
    const report = await generateCourseReportService(req.params.courseId);
    res.status(200).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
 
 
export const getResourceUtilization = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const report = await getUtilizationByResource(
      startDate,
      endDate
    );

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getResourceTypeUtilization = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const report = await getUtilizationByResourceType(
      startDate,
      endDate
    );

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};