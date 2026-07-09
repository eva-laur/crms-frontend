import Notification from "./notifications.model.js";
import User from "../users/users.model.js";
import { sendEmail } from "../../shared/utils/email.js";
import { publish } from "../../shared/events/sseHub.js";

// Send a notification to a user
export const sendNotificationService = async ({
  recipient,
  title,
  message,
  type,
  referenceId,
}) => {
  const notification = await Notification.create({
    recipient,
    title,
    message,
    type: type || "general",
    referenceId,
  });

  // Push it to the recipient's browser instantly, if they're connected
  // (see GET /notifications/stream) — no need to wait for the next poll.
  publish(recipient, "notification", notification);

  // Email sending is best-effort only (must not break flow)
  try {
    const user = await User.findById(recipient).select("email");

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: title,
        text: message,
      });
    }
  } catch (error) {
    console.error(
      "[notification-email] Failed to send email:",
      error.message
    );
  }

  return notification;
};

// Send the same notification to multiple users at once
export const sendBulkNotificationService = async (
  recipientIds,
  { title, message, type, referenceId, senderName, senderRole, courseCode, courseTitle, specialty, classLevel, recipientCount }
) => {
  const notifications = recipientIds.map((recipient) => ({
    recipient,
    title,
    message,
    type: type || "general",
    referenceId,
    senderName:     senderName ?? null,
    senderRole:     senderRole ?? null,
    courseCode:     courseCode ?? null,
    courseTitle:    courseTitle ?? null,
    specialty:      specialty ?? null,
    classLevel:     classLevel ?? null,
    recipientCount: recipientCount ?? null,
  }));

  const created = await Notification.insertMany(notifications);
  // Push each one to its recipient's browser instantly, same as the
  // single-recipient path above.
  created.forEach((n) => publish(n.recipient, "notification", n));
  return created;
};

// Get all notifications for a specific user
export const getNotificationsByUserService = async (userId) => {
  return await Notification.find({ recipient: userId }).sort({ createdAt: -1 });
};

// Get unread notifications count for a user
export const getUnreadCountService = async (userId) => {
  return await Notification.countDocuments({
    recipient: userId,
    read: false,
  });
};

// Mark a single notification as read
export const markAsReadService = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true },
    { new: true }
  );
};

// Mark all notifications as read for a user
export const markAllAsReadService = async (userId) => {
  return await Notification.updateMany(
    { recipient: userId, read: false },
    { read: true }
  );
};

// Delete a notification
export const deleteNotificationService = async (notificationId, userId) => {
  return await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });
};