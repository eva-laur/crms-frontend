import express from "express";
import {
  sendNotification,
  sendBulkNotification,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  streamNotifications,
} from "./notifications.controller.js";
import { protect, checkPermission } from "../../middleware/auth.js";

const router = express.Router();

// Live push stream — see notifications.controller.js's streamNotifications
// for why this authenticates via a query token instead of the usual header.
router.get("/stream", protect, streamNotifications);

// GET logged-in user's notifications
router.get("/me", protect, getMyNotifications);

// GET unread count for logged-in user
router.get("/me/unread-count", protect, getUnreadCount);

// MARK all as read for logged-in user
router.patch("/me/read-all", protect, markAllAsRead);

// MARK single notification as read
router.patch("/:id/read", protect, markAsRead);

// DELETE a notification (user deletes their own)
router.delete("/:id", protect, deleteNotification);

// SEND notification to one user (admin only)
router.post(
  "/",
  protect,
  checkPermission("notifications", "send"),
  sendNotification
);

// SEND bulk notification to many users (admin only)
router.post(
  "/bulk",
  protect,
  checkPermission("notifications", "send"),
  sendBulkNotification
);

export default router;
