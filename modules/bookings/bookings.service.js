import { isStaff, ROLE_RESOURCE_TYPE } from "../../shared/constants/roles.js";
import Booking from "./bookings.model.js";
import Resource from "../resources/resources.model.js";
import { getBorrowLimitService, getActiveBorrowCountService } from "../resources/resources.service.js";
import { sendNotificationService } from "../notifications/notifications.service.js";
import eventBus from "../../shared/events/EventBus.js";
import { BOOKING_EVENTS } from "../../shared/events/events.constants.js";

const populate = (q) =>
  q.populate("resource").populate("user", "name email role matricule").populate("managedBy", "name email");

// ── SHARED CONFLICT HELPER ────────────────────────────────────────────────────
// Used by createBookingService (to block a brand-new conflicting booking) and
// by overrideBookingService (to find which existing bookings a force-confirm
// would displace). Time-overlap only applies to bookings that actually carry
// a startTime/endTime — book/equipment checkouts that only use a dueDate are
// unaffected, so this generalisation does not change borrowing-limit behaviour.
const findOverlappingBookings = async ({ resourceId, startTime, endTime, excludeBookingId, statuses }) => {
  const filter = {
    resource: resourceId,
    status: { $in: statuses },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeBookingId) filter._id = { $ne: excludeBookingId };

  return await Booking.find(filter).populate("user", "name email role");
};

export const exportBookingsService = async (filter = {}) => {
  return await Booking.find(filter)
    .populate("user", "name email")
    .populate("resource", "name location type");
};
// ── CREATE ────────────────────────────────────────────────────────────────────

export const createBookingService = async ({ resource, userId, userRole, startTime, endTime, dueDate, purpose, actingRole }) => {
  const res = await Resource.findById(resource);
  if (!res) throw new Error("Resource not found");

  // Checkout-desk flow only: a library/IT/lab manager creating a booking
  // *on behalf of* a borrower can only do so for their own resource type
  // (book/equipment/lab respectively) — the same restriction already
  // enforced on approve/checkout/return/override in bookings.controller.js.
  // `actingRole` is only ever set for that on-behalf-of path (see
  // bookings.controller.js's createBooking) — a student/faculty booking for
  // themselves is untouched by this.
  if (actingRole) {
    const scopedType = ROLE_RESOURCE_TYPE[actingRole];
    if (scopedType && res.type !== scopedType) {
      throw new Error(`As a ${actingRole.replace(/_/g, " ")}, you can only check out "${scopedType}" resources, not "${res.type}".`);
    }
  }

  // Block any new booking while the user has an overdue item outstanding
  // (LIB-05 / IT-04: "restrict user's future bookings until return").
  // Staff are exempted — an admin/manager creating an operational
  // booking shouldn't be blocked by an unrelated overdue item on their own
  // account. Revisit this exemption if that turns out to be the wrong call.
  if (!isStaff(userRole)) {
    const hasOverdue = await Booking.exists({ user: userId, status: "overdue" });
    if (hasOverdue) {
      throw new Error("You have an overdue item. Please return it before making a new booking.");
    }
  }

  // Block booking if under maintenance
  if (res.status === "under_maintenance") {
    throw new Error(`This resource is currently under maintenance: ${res.maintenanceNote || ""}`);
  }

  // Block booking if unavailable
  if (res.status === "unavailable") {
    throw new Error("This resource is currently unavailable");
  }

  // Book borrowing limit check
  if (res.type === "book") {
    const limit  = getBorrowLimitService(userRole);
    const active = await getActiveBorrowCountService(Booking, userId);
    if (active >= limit) {
      throw new Error(`Borrowing limit reached. Your role (${userRole}) allows a maximum of ${limit} books at a time`);
    }
  }

  // Conflict detection for any resource booked with a specific time slot
  // (labs, rooms, equipment requested for a date/time — not book checkouts,
  // which use dueDate instead of startTime/endTime and are therefore
  // unaffected by this check).
  if (startTime && endTime) {
    const conflicts = await findOverlappingBookings({
      resourceId: resource,
      startTime,
      endTime,
      statuses: ["approved", "checked_out"],
    });
    if (conflicts.length > 0) {
      throw new Error(`${res.name} is already booked for the selected time slot`);
    }
  }

  const booking = await Booking.create({
    resource, user: userId, startTime, endTime, dueDate, purpose,
  });

  eventBus.emit(BOOKING_EVENTS.CREATED, { booking, resource: res });

  return booking;
};

// ── READ ──────────────────────────────────────────────────────────────────────

export const getBookingsService = async (filter = {}) =>
  await populate(Booking.find(filter).sort({ createdAt: -1 }));

// Used by the shared availability calendar — deliberately selects only
// startTime/endTime/status, never `user` or `purpose`, since this is visible
// to every student/faculty who can see the resource, not just its owner.
export const getResourceAvailabilityService = async (resourceId, weekStart, weekEnd) => {
  const bookings = await Booking.find({
    resource: resourceId,
    status: { $in: ["pending", "approved", "checked_out"] },
    startTime: { $ne: null, $lte: new Date(weekEnd) },
    endTime: { $ne: null, $gte: new Date(weekStart) },
  }).select("startTime endTime status");

  return bookings.map((b) => ({ startTime: b.startTime, endTime: b.endTime, status: b.status }));
};

export const getBookingByIdService = async (id) =>
  await populate(Booking.findById(id));

// ── APPROVE / REJECT ──────────────────────────────────────────────────────────

export const updateBookingStatusService = async (bookingId, { status, managerNote, managedBy, dueDate }) => {
  const booking = await Booking.findById(bookingId).populate("resource");
  if (!booking) return null;

  booking.status      = status;
  booking.managerNote = managerNote || null;
  booking.managedBy   = managedBy;
  if (dueDate) booking.dueDate = dueDate;

  await booking.save();

  // status is validated by the controller to be "approved" or "rejected"
  // before this service is ever called.
  eventBus.emit(
    status === "approved" ? BOOKING_EVENTS.APPROVED : BOOKING_EVENTS.REJECTED,
    { booking, resource: booking.resource }
  );

  return booking;
};

// ── CHECK OUT ─────────────────────────────────────────────────────────────────
// Self-service: the booking owner can check out their own approved booking.
// admin/manager roles retain override rights over anyone's booking (e.g.
// staff handing over equipment at a counter). `isManager` is computed by the
// controller from req.user.role, mirroring the existing pattern in
// cancelBookingService below.

export const checkOutService = async (bookingId, actingUserId, isManager, { note, condition } = {}) => {
  const booking = await Booking.findById(bookingId).populate("resource");
  if (!booking) return null;

  if (!isManager && booking.user.toString() !== actingUserId.toString()) {
    throw new Error("You are not authorised to check out this booking");
  }

  if (booking.status !== "approved") {
    throw new Error("Only approved bookings can be checked out");
  }

  booking.status       = "checked_out";
  booking.checkOutDate = new Date();
  // Records who *processed* the checkout. When a manager checks the item out
  // to someone else, managedBy != booking.user. When the booking owner
  // self-checks-out, managedBy === booking.user — that equality is a cheap
  // signal downstream if you ever want to distinguish self-service from
  // staff-assisted checkouts without adding a new field.
  booking.managedBy    = actingUserId;
  if (note)      booking.checkoutNote      = note;
  if (condition) booking.checkoutCondition = condition;
  await booking.save();

  // Decrement available copies for books
  if (booking.resource.type === "book") {
    await Resource.findByIdAndUpdate(booking.resource._id, {
      $inc: { availableCopies: -1 },
    });
  }

  eventBus.emit(BOOKING_EVENTS.CHECKED_OUT, { booking, resource: booking.resource });

  return booking;
};

// ── RETURN ────────────────────────────────────────────────────────────────────
// Same self-service-with-manager-override pattern as checkOutService.

export const returnItemService = async (bookingId, actingUserId, isManager, { condition } = {}) => {
  const booking = await Booking.findById(bookingId).populate("resource");
  if (!booking) return null;

  if (!isManager && booking.user.toString() !== actingUserId.toString()) {
    throw new Error("You are not authorised to return this booking");
  }

  if (!["checked_out", "overdue"].includes(booking.status)) {
    throw new Error("Only checked-out or overdue items can be returned");
  }

  booking.status     = "returned";
  booking.returnDate = new Date();
  booking.managedBy  = actingUserId;
  if (condition) booking.returnCondition = condition;
  await booking.save();

  // Restore available copies for books
  if (booking.resource.type === "book") {
    await Resource.findByIdAndUpdate(booking.resource._id, {
      $inc: { availableCopies: 1 },
    });
  }

  return booking;
};

// ── CANCEL ────────────────────────────────────────────────────────────────────

export const cancelBookingService = async (bookingId, userId, isManager) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) return null;

  if (!isManager && booking.user.toString() !== userId.toString()) {
    throw new Error("You are not authorised to cancel this booking");
  }

  if (["returned", "rejected", "cancelled"].includes(booking.status)) {
    throw new Error("This booking cannot be cancelled");
  }

  booking.status = "cancelled";
  await booking.save();
  return booking;
};

// ── OVERDUE DETECTION ─────────────────────────────────────────────────────────
// Called by the hourly cron job (see jobs/overdueBookings.cron.js) and also,
// as before, whenever GET /bookings/overdue is hit directly via
// getOverdueBookingsService below — both paths share this one implementation,
// so a booking is never double-notified: once its status flips to "overdue"
// it no longer matches the "checked_out" filter on a later run.

export const flagOverdueBookingsService = async () => {
  const now = new Date();

  // Fetch the documents *before* updating so we can emit a booking.overdue
  // event (with resource info) per booking — Booking.updateMany() alone only
  // returns a modified count, which isn't enough to build a notification.
  const toFlag = await Booking.find({
    status:  "checked_out",
    dueDate: { $lt: now, $ne: null },
  }).populate("resource");

  if (toFlag.length === 0) return 0;

  await Booking.updateMany(
    { _id: { $in: toFlag.map((b) => b._id) } },
    { status: "overdue" }
  );

  toFlag.forEach((booking) => {
    booking.status = "overdue"; // reflect the update just applied, for the event payload
    eventBus.emit(BOOKING_EVENTS.OVERDUE, { booking, resource: booking.resource });
  });

  return toFlag.length;
};

export const getOverdueBookingsService = async () => {
  await flagOverdueBookingsService(); // ensure up to date
  return await populate(Booking.find({ status: "overdue" }).sort({ dueDate: 1 }));
};

// ── OVERRIDE ──────────────────────────────────────────────────────────────────
// Manager/admin force-confirms a booking that is currently blocked by (or sits
// alongside) a conflicting booking on the same resource. Requires a
// justification string, which is persisted on the booking itself AND returned
// to the caller so the controller can write it into the audit log's `details`.
//
// Design choices (flagged for review):
//  - Only bookings in "pending", "rejected", or (already-conflicting) "approved"
//    can be overridden. "checked_out", "returned", and "cancelled" are terminal
//    states and cannot be force-confirmed.
//  - Displacement only cancels conflicting bookings with status "approved".
//    A conflicting "checked_out" booking means the resource is physically in
//    someone's possession right now — that can't be resolved by a database
//    update, so this throws instead of silently cancelling it. The manager
//    must resolve that case out-of-band (e.g. wait, or contact the holder).
//  - Notifications are created via a direct call to sendNotificationService
//    here, NOT via the EventBus. If/when the EventBus is wired up (see the
//    overdue-automation task), this call site is a natural candidate to
//    refactor into an emitted "booking.displaced" event instead — left as a
//    direct call for now to avoid depending on that unfinished work.
export const overrideBookingService = async (bookingId, managerId, justification) => {
  if (!justification || !justification.trim()) {
    throw new Error("A justification is required to override a booking conflict");
  }

  const booking = await Booking.findById(bookingId).populate("resource");
  if (!booking) return null;

  if (!["pending", "rejected", "approved"].includes(booking.status)) {
    throw new Error(`Cannot override a booking with status "${booking.status}"`);
  }

  let displaced = [];

  if (booking.startTime && booking.endTime) {
    // Bookings physically in use can't be displaced by a database update.
    const checkedOutConflicts = await findOverlappingBookings({
      resourceId: booking.resource._id,
      startTime: booking.startTime,
      endTime: booking.endTime,
      excludeBookingId: booking._id,
      statuses: ["checked_out"],
    });
    if (checkedOutConflicts.length > 0) {
      throw new Error(
        `Cannot override: ${booking.resource.name} is currently checked out and in use for an overlapping time slot`
      );
    }

    const approvedConflicts = await findOverlappingBookings({
      resourceId: booking.resource._id,
      startTime: booking.startTime,
      endTime: booking.endTime,
      excludeBookingId: booking._id,
      statuses: ["approved"],
    });

    for (const conflict of approvedConflicts) {
      conflict.status = "cancelled";
      await conflict.save();

      await sendNotificationService({
        recipient: conflict.user._id,
        title: "Booking cancelled due to a manager override",
        message: `Your booking for ${booking.resource.name} (${conflict.startTime.toLocaleString()} – ${conflict.endTime.toLocaleString()}) was cancelled because a manager overrode it for a higher-priority booking. Reason given: "${justification}"`,
        type: "booking",
        referenceId: conflict._id,
      });

      displaced.push(conflict);
    }
  }

  booking.status     = "approved";
  booking.managedBy   = managerId;
  booking.override    = {
    by: managerId,
    justification,
    at: new Date(),
    displacedBookings: displaced.map((d) => d._id),
  };
  await booking.save();

  return { booking, displaced };
};
