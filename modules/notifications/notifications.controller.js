import {
  sendNotificationService,
  sendBulkNotificationService,
  getNotificationsByUserService,
  getUnreadCountService,
  markAsReadService,
  markAllAsReadService,
  deleteNotificationService,
} from "./notifications.service.js";
import { subscribe, unsubscribe } from "../../shared/events/sseHub.js";
import Course from "../courses/courses.model.js";
import { ROLES } from "../../shared/constants/roles.js";

// GET /api/notifications/stream — Server-Sent Events. Keeps the connection
// open and pushes a "notification" event the instant one is created for
// this user (see sseHub.publish, called from notifications.service.js),
// instead of the client waiting on its next 30s poll.
export const streamNotifications = (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no", // disable nginx response buffering, if fronted by one
  });
  res.write("retry: 5000\n\n");
  res.flushHeaders?.();

  subscribe(req.user._id, res);

  // Keep intermediary proxies/load balancers from treating this as an idle,
  // closeable connection.
  const heartbeat = setInterval(() => {
    try { res.write(": ping\n\n"); } catch { /* connection likely already gone */ }
  }, 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe(req.user._id, res);
  });
};

// POST /api/notifications  (admin sends to a specific user)
export const sendNotification = async (req, res) => {
  try {
    const { recipient, title, message, type, referenceId } = req.body;

    const notification = await sendNotificationService({
      recipient,
      title,
      message,
      type,
      referenceId,
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/notifications/bulk  (admin broadcasts to many users, OR a
// course announcement — see courseId branch below)
export const sendBulkNotification = async (req, res) => {
  try {
    const { recipientIds, title, message, type, referenceId, courseId } = req.body;

    // Course-announcement path: recipients are derived from real enrollment,
    // never trusted from the client. A non-admin caller must actually be the
    // course's lecturer.
    if (courseId) {
      const course = await Course.findById(courseId).populate("lecturer", "name role");
      if (!course) return res.status(404).json({ message: "Course not found" });
      if (req.user.role !== ROLES.ADMIN && course.lecturer._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You can only post announcements to courses you teach" });
      }
      if (course.students.length === 0) {
        return res.status(201).json({ sent: 0, notifications: [] });
      }

      // Build the sender metadata once, attach to every notification row so
      // the inbox never needs a join to show "From Dr. Etoa · CS-401 · M1"
      const meta = {
        senderName:     course.lecturer.name,
        senderRole:     course.lecturer.role,
        courseCode:     course.courseCode,
        courseTitle:    course.title,
        specialty:      course.specialty ?? null,
        classLevel:     course.classLevel ?? null,
        recipientCount: course.students.length,
      };

      const notifications = await sendBulkNotificationService(course.students, {
        title, message, type: type || "announcement",
        referenceId: course._id, ...meta,
      });
      return res.status(201).json({ sent: notifications.length, notifications });
    }

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ message: "recipientIds must be a non-empty array" });
    }

    const notifications = await sendBulkNotificationService(recipientIds, {
      title,
      message,
      type,
      referenceId,
    });

    res.status(201).json({ sent: notifications.length, notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/notifications/me  (logged-in user's own notifications)
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await getNotificationsByUserService(req.user._id);
    res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/notifications/me/unread-count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await getUnreadCountService(req.user._id);
    res.status(200).json({ unreadCount: count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const notification = await markAsReadService(req.params.id, req.user._id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/notifications/me/read-all
export const markAllAsRead = async (req, res) => {
  try {
    await markAllAsReadService(req.user._id);
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const notification = await deleteNotificationService(req.params.id, req.user._id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
