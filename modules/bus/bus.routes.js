import express from "express";
import {
  createBus, getBuses, updateBus, deleteBus,
  createRoute, getRoutes, getRouteById, updateRoute, deleteRoute,
  getSeatAvailability,
  createReservation, getMyReservations, getAllReservations, cancelReservation, confirmReservation,
  createBusRequest, getMyBusRequests, getAllBusRequests, reviewBusRequest,
  getBusOccupancyReport,
} from "./bus.controller.js";

import { upload } from "../../config/upload.js";

import {
  addFuelLog, getFuelLogs, getFuelLogById, updateFuelLog, deleteFuelLog,
  addAttachments, deleteAttachment, verifyFuelLog,
  getConsumptionSummary, getMonthlyBreakdown, getEfficiencyRanking,
} from "./mileage.controller.js";

import { protect, checkPermission } from "../../middleware/auth.js";

const router = express.Router();

const managerOnly = [protect, checkPermission("bus", "manage")];

const fuelUpload = upload.fields([
  { name: "odometer_start", maxCount: 1 },
  { name: "odometer_end", maxCount: 1 },
  { name: "fuel_receipt", maxCount: 1 },
  { name: "other", maxCount: 2 },
]);

router.get("/fleet", ...managerOnly, getBuses);
router.post("/fleet", ...managerOnly, createBus);
router.put("/fleet/:id", ...managerOnly, updateBus);
router.delete("/fleet/:id", ...managerOnly, deleteBus);

router.get("/routes", protect, checkPermission("bus", "view"), getRoutes);
router.get("/routes/:id", protect, checkPermission("bus", "view"), getRouteById);
router.post("/routes", ...managerOnly, createRoute);
router.put("/routes/:id", ...managerOnly, updateRoute);
router.delete("/routes/:id", ...managerOnly, deleteRoute);

router.get(
  "/routes/:routeId/availability",
  protect,
  checkPermission("bus", "view"),
  getSeatAvailability
);

router.post(
  "/reservations",
  protect,
  checkPermission("bus", "reserve"),
  createReservation
);

router.get(
  "/reservations/my",
  protect,
  checkPermission("bus", "reserve"),
  getMyReservations
);

router.get(
  "/reservations",
  ...managerOnly,
  getAllReservations
);

router.patch(
  "/reservations/:id/cancel",
  protect,
  checkPermission("bus", "reserve"),
  cancelReservation
);

router.patch(
  "/reservations/:id/confirm",
  protect,
  checkPermission("bus", "manage"),
  confirmReservation
);

// ─── BUS REQUESTS (form-based trip request, faculty-only) ─────────────────────
router.post(
  "/requests",
  protect,
  checkPermission("bus", "request"),
  createBusRequest
);

router.get(
  "/requests/my",
  protect,
  checkPermission("bus", "request"),
  getMyBusRequests
);

router.get(
  "/requests",
  ...managerOnly,
  getAllBusRequests
);

router.patch(
  "/requests/:id/review",
  ...managerOnly,
  reviewBusRequest
);

router.get(
  "/reports/occupancy",
  protect,
  checkPermission("bus", "analytics"),
  getBusOccupancyReport
);

router.post("/mileage", ...managerOnly, fuelUpload, addFuelLog);
router.get("/mileage", ...managerOnly, getFuelLogs);
router.get("/mileage/:id", ...managerOnly, getFuelLogById);
router.put("/mileage/:id", ...managerOnly, updateFuelLog);
router.delete("/mileage/:id", ...managerOnly, deleteFuelLog);

router.post("/mileage/:id/attachments", ...managerOnly, fuelUpload, addAttachments);
router.delete("/mileage/:id/attachments/:attachmentId", ...managerOnly, deleteAttachment);
router.patch("/mileage/:id/verify", ...managerOnly, verifyFuelLog);

router.get("/mileage/analytics/summary", protect, checkPermission("bus", "analytics"), getConsumptionSummary);
router.get("/mileage/analytics/monthly", protect, checkPermission("bus", "analytics"), getMonthlyBreakdown);
router.get("/mileage/analytics/efficiency", protect, checkPermission("bus", "analytics"), getEfficiencyRanking);

export default router;