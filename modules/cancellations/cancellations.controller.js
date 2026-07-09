import { createCancellationService, getCancellationsService } from "./cancellations.service.js";
import Course from "../courses/courses.model.js";
import { ROLES } from "../../shared/constants/roles.js";

// POST /api/cancellations — faculty (must teach the course) or admin (any course)
export const createCancellation = async (req, res) => {
  try {
    const { course, date, timeSlot, reason } = req.body;
    const courseDoc = await Course.findById(course);
    if (!courseDoc) return res.status(404).json({ message: "Course not found" });

    if (req.user.role !== ROLES.ADMIN && courseDoc.lecturer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only cancel classes you teach" });
    }

    const cancellation = await createCancellationService({
      course, date, timeSlot, reason, cancelledBy: req.user._id,
    });
    res.status(201).json(cancellation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cancellations — same scoping as announcements: student sees their
// enrolled courses' cancellations, faculty sees their own, admin/managers see all.
export const getCancellations = async (req, res) => {
  try {
    const all = await getCancellationsService();

    let visible = all;
    if (req.user.role === ROLES.STUDENT) {
      visible = all.filter((c) => c.course?.students?.some((s) => s.toString() === req.user._id.toString()));
    } else if (req.user.role === ROLES.FACULTY) {
      visible = all.filter((c) => c.course?.lecturer?.toString() === req.user._id.toString());
    }

    res.status(200).json(visible);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
