import eventBus from "../../shared/events/EventBus.js";
import { BOOKING_EVENTS } from "../../shared/events/events.constants.js";
import { sendNotificationService } from "./notifications.service.js";

// Importing this file registers the listeners below as a side effect — it
// must be imported once at app startup (see core/App.js) before any request
// comes in. It is the only place in the codebase that turns a booking event
// into a Notification document, so all the "what does this email/in-app
// message actually say" wording lives here, not scattered across
// bookings.service.js.

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
    : null;

const notify = async (booking, { title, message }) => {
  try {
    await sendNotificationService({
      recipient: booking.user,
      title,
      message,
      type: "booking",
      referenceId: booking._id,
    });
  } catch (error) {
    // A failed notification must never take down the booking flow that
    // triggered it — this mirrors the fail-safe behaviour already used in
    // modules/audit/audit.service.js's logActionService.
    console.error(`[notifications.listeners] Failed to notify for "${title}":`, error.message);
  }
};

eventBus.on(BOOKING_EVENTS.CREATED, ({ booking, resource }) => {
  notify(booking, {
    title: "Booking request submitted",
    message: `Your booking request for ${resource.name} has been received and is pending approval.`,
  });
});

eventBus.on(BOOKING_EVENTS.APPROVED, ({ booking, resource }) => {
  notify(booking, {
    title: "Booking approved",
    message: `Your booking for ${resource.name} has been approved. You can now check it out.`,
  });
});

eventBus.on(BOOKING_EVENTS.REJECTED, ({ booking, resource }) => {
  notify(booking, {
    title: "Booking rejected",
    message: `Your booking for ${resource.name} was rejected.${
      booking.managerNote ? ` Reason: ${booking.managerNote}` : ""
    }`,
  });
});

eventBus.on(BOOKING_EVENTS.CHECKED_OUT, ({ booking, resource }) => {
  const due = formatDate(booking.dueDate);
  notify(booking, {
    title: "Item checked out",
    message: `You have checked out ${resource.name}.${due ? ` Please return it by ${due}.` : ""}`,
  });
});

eventBus.on(BOOKING_EVENTS.OVERDUE, ({ booking, resource }) => {
  const due = formatDate(booking.dueDate);
  notify(booking, {
    title: "Item overdue",
    message: `${resource.name} was due back${due ? ` on ${due}` : ""} and is now overdue. New bookings are blocked on your account until it is returned.`,
  });
});
