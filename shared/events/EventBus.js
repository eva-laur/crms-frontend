import { EventEmitter } from "node:events";

// A single shared EventEmitter instance used across the whole backend so any
// module can emit a domain event (eventBus.emit(...)) and any other module
// can react to it (eventBus.on(...)) without importing each other directly.
// This is what keeps modules/bookings from needing a hard dependency on
// modules/notifications' internals for things like "send a reminder when a
// booking goes overdue" — bookings just announces what happened, and
// whichever module cares (today: notifications) subscribes independently.
class EventBus extends EventEmitter {}

const eventBus = new EventBus();

// More listeners will likely subscribe to the same events over time
// (notifications today; maybe analytics/audit later) — raise the default
// limit of 10 so Node doesn't emit MaxListenersExceededWarning noise.
eventBus.setMaxListeners(50);

export default eventBus;
