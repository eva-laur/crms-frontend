import cron from "node-cron";
import { flagOverdueBookingsService } from "../modules/bookings/bookings.service.js";

// Runs at the top of every hour. Re-checks all "checked_out" bookings whose
// dueDate has passed, flips them to "overdue", and — via the eventBus.emit
// inside flagOverdueBookingsService — triggers an "Item overdue" notification
// for each one automatically. Previously this only ran when a manager hit
// GET /bookings/overdue manually; students/faculty now get reminded without
// anyone having to check.
//
// Schedule is a plain "0 * * * *" cron expression (top of every hour). The
// optional CRON_TZ env var lets you pin the timezone explicitly if the server
// isn't already running in the campus's local time; defaults to
// "Africa/Douala" (Cameroon, UTC+1, no DST) since that's where IUC/SEAS is.
export const startOverdueBookingsCron = () => {
  cron.schedule(
    "0 * * * *",
    async () => {
      try {
        const flaggedCount = await flagOverdueBookingsService();
        if (flaggedCount > 0) {
          console.log(`[overdue-cron] Flagged ${flaggedCount} booking(s) as overdue`);
        }
      } catch (error) {
        // Never let a bad run crash the process — just log and try again
        // next hour.
        console.error("[overdue-cron] Failed to flag overdue bookings:", error.message);
      }
    },
    { timezone: process.env.CRON_TZ || "Africa/Douala" }
  );

  console.log("[overdue-cron] Scheduled: checking for overdue bookings every hour");
};
