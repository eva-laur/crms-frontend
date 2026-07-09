// Names of the booking-related domain events emitted via shared/events/EventBus.js.
// Listeners (see modules/notifications/notifications.listeners.js) subscribe
// to these instead of hardcoding string literals on both sides.
export const BOOKING_EVENTS = {
  CREATED:     "booking.created",
  APPROVED:    "booking.approved",
  REJECTED:    "booking.rejected",
  CHECKED_OUT: "booking.checkedOut",
  OVERDUE:     "booking.overdue",
};

export default BOOKING_EVENTS;
