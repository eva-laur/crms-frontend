import { isStaff, ROLE_RESOURCE_TYPE } from "../../shared/constants/roles.js";
import User from "../users/users.model.js";
import {
  createBookingService, getBookingsService, getBookingByIdService,
  updateBookingStatusService, checkOutService, returnItemService,
  cancelBookingService, getOverdueBookingsService, overrideBookingService, exportBookingsService,
  getResourceAvailabilityService,
} from "./bookings.service.js";
import { toPDF, toExcel, toCSV } from "../../shared/utils/exportReport.js";
import { generateICS } from "../../shared/utils/icsExport.js";

// A library/IT/lab manager may only approve/checkout/return/override — or
// book-on-behalf-of a borrower for — resources of the type they own
// (book/equipment/lab respectively). Mirrors resources.controller.js's
// checkTypeScope for the same 3 roles. Admin (and logistics_manager, who
// doesn't manage this generic `resources` collection at all — that's the
// separate `bus` module) are unrestricted here. Returns an error message
// string, or null if the action is allowed.
const checkBookingTypeScope = (role, resourceType) => {
  const scopedType = ROLE_RESOURCE_TYPE[role];
  if (!scopedType) return null; // admin, or a role with no resource-type scope at all
  if (resourceType && resourceType !== scopedType) {
    return `As a ${role.replace(/_/g, " ")}, you can only act on "${scopedType}" bookings, not "${resourceType}".`;
  }
  return null;
};

export const createBooking = async (req, res) => {
  try {
    const { resource, startTime, endTime, dueDate, purpose, onBehalfOf } = req.body;

    // Staff (library/IT/lab manager, admin) can create a booking *for*
    // another user — the checkout-desk workflow, where a librarian scans a
    // book and a student's ID and hands it over in one motion. Never trust
    // a role from the client for this: look the target user up for real,
    // and apply borrow-limit/overdue checks against *their* account, not
    // the staff member's.
    let userId = req.user._id;
    let userRole = req.user.role;
    if (onBehalfOf) {
      if (!isStaff(req.user.role)) {
        return res.status(403).json({ message: "Only managers/admin can book on behalf of another user" });
      }
      const target = await User.findById(onBehalfOf);
      if (!target) return res.status(404).json({ message: "Borrower not found" });
      userId = target._id;
      userRole = target.role;
    }

    const booking = await createBookingService({
      resource, userId, userRole,
      startTime, endTime, dueDate, purpose,
      // Only enforced when a manager is acting on behalf of someone else —
      // a student/faculty booking for themselves can still request any
      // resource type, unaffected by this.
      actingRole: onBehalfOf ? req.user.role : null,
    });
    res.status(201).json(booking);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const getBookings = async (req, res) => {
  try {
    const { status, resourceType } = req.query;
    // Same scoping rule as cancelBooking/exportBookingsReport below: students
    // and faculty only ever see their own bookings ("My Bookings"). Admin and
    // manager roles see everything. (Previously this only scoped "student",
    // so any faculty account hitting this endpoint saw every booking on the
    // platform — a real data-leak bug, not an intentional design choice.)
    let filter = ["student", "faculty"].includes(req.user.role) ? { user: req.user._id } : {};
    if (status) filter.status = status;
    const bookings = await getBookingsService(filter);
    // Optionally filter by resource type post-query
    const result = resourceType
      ? bookings.filter(b => b.resource?.type === resourceType)
      : bookings;
    res.status(200).json(result);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await getBookingByIdService(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status, managerNote, dueDate } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }
    const existing = await getBookingByIdService(req.params.id);
    if (!existing) return res.status(404).json({ message: "Booking not found" });
    const scopeError = checkBookingTypeScope(req.user.role, existing.resource?.type);
    if (scopeError) return res.status(403).json({ message: scopeError });

    const booking = await updateBookingStatusService(req.params.id, {
      status, managerNote, managedBy: req.user._id, dueDate,
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const checkOut = async (req, res) => {
  try {
    const existing = await getBookingByIdService(req.params.id);
    if (!existing) return res.status(404).json({ message: "Booking not found" });
    const scopeError = checkBookingTypeScope(req.user.role, existing.resource?.type);
    if (scopeError) return res.status(403).json({ message: scopeError });

    const isManager = isStaff(req.user.role);
    const { note, condition } = req.body;
    const booking = await checkOutService(req.params.id, req.user._id, isManager, { note, condition });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json({ message: "Item checked out successfully", booking });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const returnItem = async (req, res) => {
  try {
    const existing = await getBookingByIdService(req.params.id);
    if (!existing) return res.status(404).json({ message: "Booking not found" });
    const scopeError = checkBookingTypeScope(req.user.role, existing.resource?.type);
    if (scopeError) return res.status(403).json({ message: scopeError });

    const isManager = isStaff(req.user.role);
    const { condition } = req.body;
    const booking = await returnItemService(req.params.id, req.user._id, isManager, { condition });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json({ message: "Item returned successfully", booking });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const cancelBooking = async (req, res) => {
  try {
    const isManager = isStaff(req.user.role);
    // Only restrict *staff* acting on someone else's booking to their own
    // resource type — a student/faculty cancelling their own booking is
    // unaffected (unrelated to which manager owns the resource).
    if (isManager) {
      const existing = await getBookingByIdService(req.params.id);
      if (!existing) return res.status(404).json({ message: "Booking not found" });
      const scopeError = checkBookingTypeScope(req.user.role, existing.resource?.type);
      if (scopeError) return res.status(403).json({ message: scopeError });
    }
    const booking = await cancelBookingService(req.params.id, req.user._id, isManager);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json({ message: "Booking cancelled", booking });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const getOverdueBookings = async (req, res) => {
  try {
    const bookings = await getOverdueBookingsService();
    // library/IT/lab managers only see overdue items for their own resource
    // type here too — same reasoning as everywhere else in this file.
    const scopedType = ROLE_RESOURCE_TYPE[req.user.role];
    const result = scopedType ? bookings.filter(b => b.resource?.type === scopedType) : bookings;
    res.status(200).json(result);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// PATCH /bookings/:id/override  (admin, library_manager, it_manager, lab_manager)
// Force-confirms a booking despite a detected conflict. Requires a
// `justification` string in the body. Any displaced bookings are listed in
// the response, and the justification + displaced IDs are attached to
// res.locals.auditDetails so the auditLogger middleware (see
// middleware/auditLogger.js) records them on this request's audit log entry.
export const overrideBooking = async (req, res) => {
  try {
    const { justification } = req.body;
    if (!justification || !justification.trim()) {
      return res.status(400).json({ message: "A justification is required to override a booking" });
    }

    const existing = await getBookingByIdService(req.params.id);
    if (!existing) return res.status(404).json({ message: "Booking not found" });
    const scopeError = checkBookingTypeScope(req.user.role, existing.resource?.type);
    if (scopeError) return res.status(403).json({ message: scopeError });

    const result = await overrideBookingService(req.params.id, req.user._id, justification);
    if (!result) return res.status(404).json({ message: "Booking not found" });

    const { booking, displaced } = result;

    // Picked up by middleware/auditLogger.js and merged into the AuditLog
    // entry's `details` field for this request.
    res.locals.auditDetails = {
      justification,
      displacedBookingIds: displaced.map((d) => d._id),
    };

    res.status(200).json({
      message: displaced.length > 0
        ? `Booking overridden. ${displaced.length} conflicting booking(s) cancelled and notified.`
        : "Booking force-confirmed (no conflicting bookings found).",
      booking,
      displaced,
    });
  } catch (error) { res.status(400).json({ message: error.message }); }
};
export const exportBookingsReport = async (req, res) => {
  try {
    const format = req.query.format || "pdf";

    // Same scoping rule as getBookings: students and faculty only ever see
    // their own bookings. Admin/manager roles see everything — this
    // codebase has no concept of a manager being assigned to specific
    // resources (approve/checkout/override are already global for that
    // role), so "everything they manage" means every resource, same as admin.
    const filter = ["student", "faculty"].includes(req.user.role)
      ? { user: req.user._id }
      : {};

    const bookings = await exportBookingsService(filter);

    const data = bookings.map((b) => ({
      bookingId: b._id.toString(),
      user: b.user?.name || "",
      resource: b.resource?.name || "",
      resourceType: b.resource?.type || "",
      status: b.status,
      purpose: b.purpose,
      dueDate: b.dueDate
        ? new Date(b.dueDate).toLocaleString()
        : "",
    }));

    let result;

    if (format === "pdf") {
      result = await toPDF(data, "Bookings_Report");
    } else if (format === "xlsx") {
      result = await toExcel(data, "Bookings_Report");
    } else if (format === "csv") {
      result = await toCSV(data, "Bookings_Report");
    } else {
      return res.status(400).json({
        message: "Invalid format. Use pdf, xlsx, or csv",
      });
    }

    res.set(result.headers);
    res.send(result.buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const exportBookingsCalendar = async (req, res) => {
  try {
    // Same scoping rule as exportBookingsReport above.
    const filter = ["student", "faculty"].includes(req.user.role)
      ? { user: req.user._id }
      : {};

    const bookings = await exportBookingsService(filter);

    const validBookings = bookings.filter(
      (b) => b.startTime && b.endTime
    );

    const ics = generateICS(validBookings);

    res.set({
      "Content-Type": "text/calendar",
      "Content-Disposition":
        'attachment; filename="bookings.ics"',
    });

    res.send(ics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /bookings/resource/:resourceId/availability?weekStart=&weekEnd=
// Privacy-preserving: returns only start/end/status for active bookings on
// this resource in the given range — used to render a shared availability
// calendar (e.g. lab/hall scheduling) without leaking who booked what or why
// to every other student/faculty who can see the same resource.
export const getResourceAvailability = async (req, res) => {
  try {
    const { weekStart, weekEnd } = req.query;
    if (!weekStart || !weekEnd) {
      return res.status(400).json({ message: "weekStart and weekEnd query params are required" });
    }
    const slots = await getResourceAvailabilityService(req.params.resourceId, weekStart, weekEnd);
    res.status(200).json(slots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
