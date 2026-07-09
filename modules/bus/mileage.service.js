import { FuelLog, Bus } from "./bus.model.js";
import { publicUploadUrl, deleteUploadedFile } from "../../config/paths.js";

// ─── SUBMIT FUEL LOG (driver) ─────────────────────────────────────────────────

export const addFuelLogService = async ({
  busId, routeId, date, driver,
  startOdometer, endOdometer,
  fuelFilled, pricePerLitre,
  notes, submittedBy, files,
}) => {
  if (endOdometer <= startOdometer) {
    throw new Error("End odometer must be greater than start odometer");
  }

  // Map uploaded files to attachments — stored locally under
  // uploads/fuel-logs/ (see config/upload.js), served via the "/uploads"
  // static mount (core/App.js).
  const attachments = (files || []).map((file) => ({
    url:      publicUploadUrl("fuel-logs", file.filename),
    publicId: file.filename,
    label:    file.fieldname,  // 'odometer_start' | 'odometer_end' | 'fuel_receipt' | 'other'
  }));

  const log = new FuelLog({
    bus: busId,
    route: routeId || null,
    date,
    driver,
    startOdometer,
    endOdometer,
    fuelFilled,
    pricePerLitre,
    notes,
    attachments,
    submittedBy,
    verification: { status: "pending" },
  });

  await log.save();
  return log;
};

// ─── GET LOGS ─────────────────────────────────────────────────────────────────

export const getFuelLogsService = async (busId, status, startDate, endDate) => {
  const query = {};
  if (busId)  query.bus = busId;
  if (status) query["verification.status"] = status;
  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  return await FuelLog.find(query)
    .populate("bus",   "plateNumber model")
    .populate("route", "name origin destination")
    .populate("submittedBy", "name email")
    .populate("verification.verifiedBy", "name email")
    .sort({ date: -1 });
};

export const getFuelLogByIdService = async (id) =>
  await FuelLog.findById(id)
    .populate("bus",   "plateNumber model")
    .populate("route", "name origin destination")
    .populate("submittedBy", "name email")
    .populate("verification.verifiedBy", "name email");

// ─── ADD MORE PHOTOS TO AN EXISTING LOG ──────────────────────────────────────

export const addAttachmentsService = async (logId, files) => {
  const log = await FuelLog.findById(logId);
  if (!log) return null;

  if (log.verification.status === "verified") {
    throw new Error("Cannot add attachments to a verified log");
  }

  const newAttachments = files.map((file) => ({
    url:      file.path,
    publicId: file.filename,
    label:    file.fieldname,
  }));

  log.attachments.push(...newAttachments);
  await log.save();
  return log;
};

// ─── DELETE A SINGLE ATTACHMENT ───────────────────────────────────────────────

export const deleteAttachmentService = async (logId, attachmentId) => {
  const log = await FuelLog.findById(logId);
  if (!log) return null;

  if (log.verification.status === "verified") {
    throw new Error("Cannot remove attachments from a verified log");
  }

  const attachment = log.attachments.id(attachmentId);
  if (!attachment) return null;

  // Remove the file from local disk (previously this called an undefined
  // Cloudinary deleteImage() helper that never existed — a dead reference).
  deleteUploadedFile(attachment.url);

  log.attachments.pull({ _id: attachmentId });
  await log.save();
  return log;
};

// ─── VERIFY / REJECT (resource manager / admin) ───────────────────────────────

export const verifyFuelLogService = async (logId, { status, remarks, verifierId }) => {
  const log = await FuelLog.findById(logId);
  if (!log) return null;

  log.verification.status     = status;
  log.verification.verifiedBy = verifierId;
  log.verification.verifiedAt = new Date();
  log.verification.remarks    = remarks || null;

  await log.save();
  return log;
};

// ─── UPDATE (only if still pending) ──────────────────────────────────────────

export const updateFuelLogService = async (id, updates) => {
  const log = await FuelLog.findById(id);
  if (!log) return null;

  if (log.verification.status !== "pending") {
    throw new Error("Only pending logs can be edited");
  }

  // Don't allow overwriting attachments or verification via this route
  delete updates.attachments;
  delete updates.verification;

  Object.assign(log, updates);
  await log.save();
  return log;
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

export const deleteFuelLogService = async (id) => {
  const log = await FuelLog.findById(id);
  if (!log) return null;

  // Remove each attached file from local disk (same fix as above).
  for (const att of log.attachments) {
    deleteUploadedFile(att.url);
  }

  await log.deleteOne();
  return log;
};

// ─── ANALYTICS (only count verified logs) ────────────────────────────────────

export const getBusConsumptionSummaryService = async (startDate, endDate) => {
  const match = { "verification.status": "verified" };
  if (startDate && endDate) {
    match.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const summaries = await FuelLog.aggregate([
    { $match: match },
    {
      $group: {
        _id:            "$bus",
        totalKm:        { $sum: "$mileage" },
        totalFuel:      { $sum: "$fuelFilled" },
        totalCost:      { $sum: "$totalFuelCost" },
        avgConsumption: { $avg: "$consumption" },
        tripCount:      { $sum: 1 },
      },
    },
    {
      $addFields: {
        costPerKm: {
          $cond: [
            { $gt: ["$totalKm", 0] },
            { $round: [{ $divide: ["$totalCost", "$totalKm"] }, 2] },
            0,
          ],
        },
        avgConsumption: { $round: ["$avgConsumption", 2] },
      },
    },
    { $sort: { totalCost: -1 } },
  ]);

  const buses = await Bus.find({ _id: { $in: summaries.map((s) => s._id) } })
    .select("plateNumber model capacity");
  const busMap = Object.fromEntries(buses.map((b) => [b._id.toString(), b]));

  return summaries.map((s) => ({
    bus:                    busMap[s._id.toString()] || s._id,
    totalKm:                parseFloat(s.totalKm.toFixed(2)),
    totalFuelLitres:        parseFloat(s.totalFuel.toFixed(2)),
    totalCost:              parseFloat(s.totalCost.toFixed(2)),
    avgConsumptionPer100km: s.avgConsumption,
    costPerKm:              s.costPerKm,
    tripCount:              s.tripCount,
  }));
};

export const getMonthlyBreakdownService = async (busId, year) => {
  const mongoose = (await import("mongoose")).default;
  const match = { "verification.status": "verified" };
  if (busId) match.bus = new mongoose.Types.ObjectId(busId);
  if (year) {
    match.date = {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`),
    };
  }

  const data = await FuelLog.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year:  { $year:  "$date" },
          month: { $month: "$date" },
          bus:   "$bus",
        },
        totalKm:   { $sum: "$mileage" },
        totalFuel: { $sum: "$fuelFilled" },
        totalCost: { $sum: "$totalFuelCost" },
        trips:     { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return data.map((d) => ({
    year:        d._id.year,
    month:       months[d._id.month - 1],
    busId:       d._id.bus,
    totalKm:     parseFloat(d.totalKm.toFixed(2)),
    totalFuel:   parseFloat(d.totalFuel.toFixed(2)),
    totalCost:   parseFloat(d.totalCost.toFixed(2)),
    trips:       d.trips,
    avgCostPerKm: d.totalKm > 0 ? parseFloat((d.totalCost / d.totalKm).toFixed(2)) : 0,
  }));
};

export const getEfficiencyRankingService = async () => {
  const summaries = await getBusConsumptionSummaryService();
  const ranked = [...summaries].sort(
    (a, b) => a.avgConsumptionPer100km - b.avgConsumptionPer100km
  );
  return ranked.map((s, i) => ({
    rank:                   i + 1,
    bus:                    s.bus,
    avgConsumptionPer100km: s.avgConsumptionPer100km,
    costPerKm:              s.costPerKm,
    totalCost:              s.totalCost,
    totalKm:                s.totalKm,
    verdict: i === 0 ? "Most efficient"
           : i === ranked.length - 1 ? "Least efficient"
           : "Average",
  }));
};
