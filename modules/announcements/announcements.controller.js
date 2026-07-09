import {
  createAnnouncementService,
  getAnnouncementsService,
  getAnnouncementByIdService,
  deleteAnnouncementService,
} from "./announcements.service.js";
import Course from "../courses/courses.model.js";
import { ROLES } from "../../shared/constants/roles.js";

// POST /api/announcements — faculty (must teach the course) or admin (any course)
export const createAnnouncement = async (req, res) => {
  try {
    const { course, title, body } = req.body;
    const courseDoc = await Course.findById(course);
    if (!courseDoc) return res.status(404).json({ message: "Course not found" });

    if (req.user.role !== ROLES.ADMIN && courseDoc.lecturer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only post announcements for courses you teach" });
    }

    const ann = await createAnnouncementService({ course, title, body, postedBy: req.user._id });
    res.status(201).json(ann);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/announcements — scoped: student sees announcements for courses
// they're enrolled in; faculty sees announcements for courses they teach
// (their own posts); admin/managers see everything.
export const getAnnouncements = async (req, res) => {
  try {
    const all = await getAnnouncementsService();

    let visible = all;
    if (req.user.role === ROLES.STUDENT) {
      visible = all.filter((a) => a.course?.students?.some((s) => s.toString() === req.user._id.toString()));
    } else if (req.user.role === ROLES.FACULTY) {
      visible = all.filter((a) => a.course?.lecturer?.toString() === req.user._id.toString());
    }

    res.status(200).json(visible);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/announcements/:id — poster or admin
export const deleteAnnouncement = async (req, res) => {
  try {
    const ann = await getAnnouncementByIdService(req.params.id);
    if (!ann) return res.status(404).json({ message: "Announcement not found" });
    if (req.user.role !== ROLES.ADMIN && ann.postedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own announcements" });
    }
    await deleteAnnouncementService(req.params.id);
    res.status(200).json({ message: "Announcement deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
