import * as svc from "./mileage.service.js";

// POST /api/bus/mileage  — driver submits log + photos
export const addFuelLog = async (req, res) => {
  try {
    const { busId, routeId, date, driver, startOdometer, endOdometer, fuelFilled, pricePerLitre, notes } = req.body;
    const log = await svc.addFuelLogService({
      busId, routeId, date, driver,
      startOdometer: Number(startOdometer),
      endOdometer:   Number(endOdometer),
      fuelFilled:    Number(fuelFilled),
      pricePerLitre: Number(pricePerLitre),
      notes,
      submittedBy: req.user._id,
      files: req.files || [],
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/bus/mileage?busId=&status=pending|verified|rejected&startDate=&endDate=
export const getFuelLogs = async (req, res) => {
  try {
    const { busId, status, startDate, endDate } = req.query;
    res.status(200).json(await svc.getFuelLogsService(busId, status, startDate, endDate));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/bus/mileage/:id
export const getFuelLogById = async (req, res) => {
  try {
    const log = await svc.getFuelLogByIdService(req.params.id);
    if (!log) return res.status(404).json({ message: "Fuel log not found" });
    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/bus/mileage/:id  — edit (only if pending)
export const updateFuelLog = async (req, res) => {
  try {
    const log = await svc.updateFuelLogService(req.params.id, req.body);
    if (!log) return res.status(404).json({ message: "Fuel log not found" });
    res.status(200).json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/bus/mileage/:id
export const deleteFuelLog = async (req, res) => {
  try {
    const log = await svc.deleteFuelLogService(req.params.id);
    if (!log) return res.status(404).json({ message: "Fuel log not found" });
    res.status(200).json({ message: "Fuel log and attachments deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/bus/mileage/:id/attachments  — add more photos later
export const addAttachments = async (req, res) => {
  try {
    const log = await svc.addAttachmentsService(req.params.id, req.files || []);
    if (!log) return res.status(404).json({ message: "Fuel log not found" });
    res.status(200).json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/bus/mileage/:id/attachments/:attachmentId
export const deleteAttachment = async (req, res) => {
  try {
    const log = await svc.deleteAttachmentService(req.params.id, req.params.attachmentId);
    if (!log) return res.status(404).json({ message: "Fuel log or attachment not found" });
    res.status(200).json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /api/bus/mileage/:id/verify  — manager reviews photos and verifies/rejects
export const verifyFuelLog = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be 'verified' or 'rejected'" });
    }
    const log = await svc.verifyFuelLogService(req.params.id, {
      status,
      remarks,
      verifierId: req.user._id,
    });
    if (!log) return res.status(404).json({ message: "Fuel log not found" });
    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
export const getConsumptionSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    res.status(200).json(await svc.getBusConsumptionSummaryService(startDate, endDate));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getMonthlyBreakdown = async (req, res) => {
  try {
    const { busId, year } = req.query;
    res.status(200).json(await svc.getMonthlyBreakdownService(busId, year));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getEfficiencyRanking = async (req, res) => {
  try {
    res.status(200).json(await svc.getEfficiencyRankingService());
  } catch (error) { res.status(500).json({ message: error.message }); }
};
