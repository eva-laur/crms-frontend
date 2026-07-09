import mongoose from "mongoose";

// Course-scoped announcements — visible to everyone enrolled in `course`
// (see announcements.controller.js for the visibility scoping) plus the
// lecturer who posted them and admin/managers.
const announcementSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);
