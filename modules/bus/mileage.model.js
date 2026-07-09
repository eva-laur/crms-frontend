import mongoose from "mongoose";

const mileageLogSchema = new mongoose.Schema(
  {
    bus:   { type: mongoose.Schema.Types.ObjectId, ref: "Bus",   required: true },
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    date: { type: Date, required: true, default: Date.now },

    // Odometer readings
    startOdometer: { type: Number, required: true }, // km
    endOdometer:   { type: Number, required: true }, // km

    // Computed on save
    distanceCovered: { type: Number }, // km

    // Fuel
    fuelConsumed:      { type: Number, required: true }, // litres
    fuelPricePerLitre: { type: Number, required: true }, // local currency (XAF)
    totalFuelCost:     { type: Number },                 // computed on save

    // Extra costs (tolls, repairs on the road, etc.)
    additionalCosts: { type: Number, default: 0 },
    additionalNotes: { type: String },

    driverNotes: { type: String },
  },
  { timestamps: true }
);

// Auto-compute distance and total cost before saving
mileageLogSchema.pre("save", function () {
  this.distanceCovered = parseFloat((this.endOdometer - this.startOdometer).toFixed(2));
  this.totalFuelCost   = parseFloat((this.fuelConsumed * this.fuelPricePerLitre + this.additionalCosts).toFixed(2));
});

export default mongoose.model("MileageLog", mileageLogSchema);
