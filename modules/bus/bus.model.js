import mongoose from "mongoose";

// ─── BUS FLEET ────────────────────────────────────────────────────────────────
const busSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, unique: true },
    model:       { type: String, required: true },
    capacity:    { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "under_maintenance", "inactive"],
      default: "active",
    },
    // No separate MaintenanceLog model exists on the backend (unlike the
    // frontend's original mock, which tracked cost/type/nextDue history per
    // entry) — this is a single free-text note for whatever's currently
    // keeping the bus out of service, set alongside `status`.
    maintenanceNote: { type: String, default: null },
  },
  { timestamps: true }
);

// ─── ROUTE ────────────────────────────────────────────────────────────────────
const routeSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true },
    origin:           { type: String, required: true },
    destination:      { type: String, required: true },
    stops:            [{ type: String }],
    departureTime:    { type: String, required: true },
    estimatedArrival: { type: String, required: true },
    distanceKm:       { type: Number, default: null },
    bus:              { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
    daysOfOperation:  [{ type: String, enum: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] }],
    isActive:         { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ─── RESERVATION ──────────────────────────────────────────────────────────────
const busReservationSchema = new mongoose.Schema(
  {
    route:      { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
    passenger:  { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
    travelDate: { type: Date, required: true },
    seatNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// ─── FUEL LOG ─────────────────────────────────────────────────────────────────
const fuelLogSchema = new mongoose.Schema(
  {
    bus:   { type: mongoose.Schema.Types.ObjectId, ref: "Bus",  required: true },
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", default: null },

    date:          { type: Date,   required: true, default: Date.now },
    driver:        { type: String, required: true },

    // Odometer readings (km)
    startOdometer: { type: Number, required: true },
    endOdometer:   { type: Number, required: true },

    // Fuel
    fuelFilled:    { type: Number, required: true }, // litres
    pricePerLitre: { type: Number, required: true }, // local currency per litre

    // Auto-computed by pre-save hook
    mileage:       { type: Number }, // km = endOdometer - startOdometer
    totalFuelCost: { type: Number }, // fuelFilled × pricePerLitre
    consumption:   { type: Number }, // litres per 100 km

    // Photo evidence (odometer photos + fuel receipt) uploaded by driver
    attachments: [
      {
        url:      { type: String, required: true }, // public URL under /uploads/fuel-logs/
        publicId: { type: String, required: true }, // local filename on disk
        label: {
          type: String,
          enum: ["odometer_start", "odometer_end", "fuel_receipt", "other"],
          default: "other",
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Verification status set by resource manager / admin after reviewing photos
    verification: {
      status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      verifiedAt: { type: Date, default: null },
      remarks:    { type: String, default: null },
    },

    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notes:       { type: String, default: null },
  },
  { timestamps: true }
);

// Auto-compute mileage, cost, and consumption on every save.
// Zero-argument form (no `next` callback) — Mongoose treats this as
// synchronous middleware and proceeds automatically once it returns,
// which avoids version-dependent issues with the callback-style signature.
fuelLogSchema.pre("save", function () {
  this.mileage       = parseFloat((this.endOdometer - this.startOdometer).toFixed(2));
  this.totalFuelCost = parseFloat((this.fuelFilled * this.pricePerLitre).toFixed(2));
  this.consumption   = this.mileage > 0
    ? parseFloat(((this.fuelFilled / this.mileage) * 100).toFixed(2))
    : 0;
});

export const Bus            = mongoose.model("Bus",            busSchema);
export const Route          = mongoose.model("Route",          routeSchema);
export const BusReservation = mongoose.model("BusReservation", busReservationSchema);

// ─── BUS REQUEST ──────────────────────────────────────────────────────────────
// Replaces the old per-seat click-to-reserve for non-manager roles. A
// requester (faculty only — students can no longer make bus requests directly,
// per policy) fills out a trip-request form and submits it; the logistics
// manager reviews the queue and confirms or rejects it. This is a separate
// concept from BusReservation (which is still used for tracking per-seat
// availability on confirmed trips).
const busRequestSchema = new mongoose.Schema(
  {
    requester:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason:          { type: String, required: true },
    travelDate:      { type: Date,   required: true },
    departureTime:   { type: String, required: true }, // e.g. "09:00"
    destination:     { type: String, required: true },
    numberOfBuses:   { type: Number, required: true, min: 1 },
    estimatedRiders: { type: Number, default: null },
    notes:           { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    managerNote:     { type: String, default: null },
    reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt:      { type: Date, default: null },
  },
  { timestamps: true }
);

export const BusRequest = mongoose.model("BusRequest", busRequestSchema);
export const FuelLog        = mongoose.model("FuelLog",        fuelLogSchema);
