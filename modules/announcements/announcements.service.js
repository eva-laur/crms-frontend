import Announcement from "./announcements.model.js";

export const createAnnouncementService = async ({ course, title, body, postedBy }) => {
  const ann = await Announcement.create({ course, title, body, postedBy });
  return ann.populate([{ path: "course" }, { path: "postedBy", select: "name email role" }]);
};

export const getAnnouncementsService = async (filter = {}) => {
  return Announcement.find(filter)
    .populate("course")
    .populate("postedBy", "name email role")
    .sort({ createdAt: -1 });
};

export const getAnnouncementByIdService = async (id) => {
  return Announcement.findById(id).populate("course").populate("postedBy", "name email role");
};

export const deleteAnnouncementService = async (id) => {
  return Announcement.findByIdAndDelete(id);
};
