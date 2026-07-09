import express from "express";
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  checkOut,
  returnItem,
  cancelBooking,
  getOverdueBookings,
  exportBookingsReport,
  exportBookingsCalendar,
  overrideBooking,
  getResourceAvailability,
} from "./bookings.controller.js";

import { protect, checkPermission } from "../../middleware/auth.js";

const router = express.Router();

// View bookings
router.get(
  "/",
  protect,
  checkPermission("bookings", "view"),
  getBookings
);

router.get(
  "/overdue",
  protect,
  checkPermission("bookings", "view_overdue"),
  getOverdueBookings
);

router.get(
  "/export",
  protect,
  checkPermission("bookings", "view"),
  exportBookingsReport
);

router.get(
  "/calendar",
  protect,
  checkPermission("bookings", "view"),
  exportBookingsCalendar
);

// Privacy-preserving busy/free slots for one resource — unlike GET /, this
// is NOT scoped to "my own bookings" for student/faculty, since a shared
// availability calendar needs everyone to see when a room/lab is busy.
// Returns only start/end times + status, never who booked it or why.
router.get(
  "/resource/:resourceId/availability",
  protect,
  checkPermission("bookings", "view"),
  getResourceAvailability
);

router.get(
  "/:id",
  protect,
  checkPermission("bookings", "view"),
  getBookingById
);

// Create booking
router.post(
  "/",
  protect,
  checkPermission("bookings", "create"),
  createBooking
);

// Approve / reject
router.patch(
  "/:id/status",
  protect,
  checkPermission("bookings", "approve"),
  updateBookingStatus
);

// Checkout
router.patch(
  "/:id/checkout",
  protect,
  checkPermission("bookings", "checkout"),
  checkOut
);

// Return
router.patch(
  "/:id/return",
  protect,
  checkPermission("bookings", "return"),
  returnItem
);

// Cancel
router.patch(
  "/:id/cancel",
  protect,
  checkPermission("bookings", "cancel"),
  cancelBooking
);

// Override
router.patch(
  "/:id/override",
  protect,
  checkPermission("bookings", "override"),
  overrideBooking
);

export default router;