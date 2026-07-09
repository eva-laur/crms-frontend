import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["booking", "result", "attendance", "general", "announcement", "class_cancellation"],
      default: "general",
    },

    read: {
      type: Boolean,
      default: false,
    },

    // Optional reference to a related document (e.g. a booking ID or Course ID)
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    // Sender metadata — populated at send time from the lecturer's profile and
    // the course being announced to. Stored denormalised so the notification
    // inbox can show "From Dr. Etoa — CS-401 · Computer Science · L3" without
    // a populate join every time the bell is opened.
    senderName:      { type: String, default: null },
    senderRole:      { type: String, default: null },
    courseCode:      { type: String, default: null },  // e.g. "CS-401"
    courseTitle:     { type: String, default: null },  // e.g. "Distributed Systems"
    specialty:       { type: String, default: null },  // e.g. "Computer Science"
    classLevel:      { type: String, default: null },  // e.g. "M1"
    recipientCount:  { type: Number, default: null },  // how many students received this
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Notification", notificationSchema);
