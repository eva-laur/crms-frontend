import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    resource: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true },
    user:     { type: mongoose.Schema.Types.ObjectId, ref: "User",     required: true },

    // For labs: time-slot booking
    startTime: { type: Date, default: null },
    endTime:   { type: Date, default: null },

    // For equipment/books: checkout due date
    dueDate:      { type: Date, default: null },
    checkOutDate: { type: Date, default: null },
    returnDate:   { type: Date, default: null },

    purpose: { type: String, required: true },

    status: {
      type: String,
      enum: [
        "pending",       // just submitted
        "approved",      // approved, not yet picked up
        "rejected",      // declined by manager
        "checked_out",   // physically taken by user
        "returned",      // brought back
        "overdue",       // past due date and not returned
        "cancelled",     // user cancelled before approval
      ],
      default: "pending",
    },

    // Manager's note on approval/rejection
    managerNote: { type: String, default: null },
    managedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Optional condition tracking at handoff time, set by whoever processes
    // the checkout/return (matches the "Initial item state" / staff-note UI
    // on the checkout desk). All optional — purely informational, no
    // business logic depends on these.
    checkoutCondition: { type: String, default: null },
    checkoutNote:       { type: String, default: null },
    returnCondition:    { type: String, default: null },

    // Populated only when this booking was force-confirmed over a detected
    // conflict via PATCH /bookings/:id/override. Kept on the booking itself
    // (in addition to the AuditLog entry) so the justification is visible
    // directly on the record without needing to cross-reference the audit log.
    override: {
      type: {
        by:            { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        justification: { type: String },
        at:            { type: Date },
        displacedBookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
      },
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
