import * as svc from "./bus.service.js";
import { isBusManager } from "../../shared/constants/roles.js";
export const createBus = async (req, res) => {
  try { res.status(201).json(await svc.createBusService(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
};
export const getBuses = async (req, res) => {
  try { res.status(200).json(await svc.getBusesService()); }
  catch (e) { res.status(500).json({ message: e.message }); }
};
export const updateBus = async (req, res) => {
  try {
    const bus = await svc.updateBusService(req.params.id, req.body);
    if (!bus) return res.status(404).json({ message: "Bus not found" });
    res.status(200).json(bus);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
export const deleteBus = async (req, res) => {
  try {
    const bus = await svc.deleteBusService(req.params.id);
    if (!bus) return res.status(404).json({ message: "Bus not found" });
    res.status(200).json({ message: "Bus deleted successfully" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── ROUTES ───────────────────────────────────────────────────────────────────
export const createRoute = async (req, res) => {
  try { res.status(201).json(await svc.createRouteService(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
};
export const getRoutes = async (req, res) => {
  try { res.status(200).json(await svc.getRoutesService()); }
  catch (e) { res.status(500).json({ message: e.message }); }
};
export const getRouteById = async (req, res) => {
  try {
    const route = await svc.getRouteByIdService(req.params.id);
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.status(200).json(route);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
export const updateRoute = async (req, res) => {
  try {
    const route = await svc.updateRouteService(req.params.id, req.body);
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.status(200).json(route);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
export const deleteRoute = async (req, res) => {
  try {
    const route = await svc.deleteRouteService(req.params.id);
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.status(200).json({ message: "Route deleted successfully" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── SEAT AVAILABILITY ────────────────────────────────────────────────────────
export const getSeatAvailability = async (req, res) => {
  try {
    const { travelDate } = req.query;
    if (!travelDate) return res.status(400).json({ message: "travelDate query param required" });
    const data = await svc.getSeatAvailabilityService(req.params.routeId, travelDate);
    if (!data) return res.status(404).json({ message: "Route not found" });
    res.status(200).json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────
export const createReservation = async (req, res) => {
  try {
    const { routeId, travelDate, seatNumber } = req.body;
    const reservation = await svc.createReservationService({
      routeId, passengerId: req.user._id, travelDate, seatNumber,
    });
    res.status(201).json(reservation);
  } catch (e) { res.status(400).json({ message: e.message }); }
};
export const getMyReservations = async (req, res) => {
  try { res.status(200).json(await svc.getMyReservationsService(req.user._id)); }
  catch (e) { res.status(500).json({ message: e.message }); }
};
export const getAllReservations = async (req, res) => {
  try { res.status(200).json(await svc.getAllReservationsService()); }
  catch (e) { res.status(500).json({ message: e.message }); }
};
export const cancelReservation = async (req, res) => {
  try {
    const isAdmin = isBusManager(req.user.role);
    const reservation = await svc.cancelReservationService(req.params.id, req.user._id, isAdmin);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    res.status(200).json({ message: "Reservation cancelled", reservation });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

// Manager/admin only (route is gated by checkPermission("bus","manage")) —
// confirms a pending reservation.
export const confirmReservation = async (req, res) => {
  try {
    const reservation = await svc.confirmReservationService(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    res.status(200).json({ message: "Reservation confirmed", reservation });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

// ─── REPORTS ─────────────────────────────────────────────────────────────────
export const getBusOccupancyReport = async (req, res) => {
  try {
    const { routeId, startDate, endDate } = req.query;
    res.status(200).json(await svc.getBusOccupancyReportService(routeId, startDate, endDate));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── BUS REQUESTS ─────────────────────────────────────────────────────────────
// (service functions accessed via the top-level `import * as svc` above)

export const createBusRequest = async (req, res) => {
  try {
    const { reason, travelDate, departureTime, destination, numberOfBuses, estimatedRiders, notes } = req.body;
    if (!reason || !travelDate || !departureTime || !destination || !numberOfBuses)
      return res.status(400).json({ message: "reason, travelDate, departureTime, destination and numberOfBuses are required" });
    const request = await svc.createBusRequestService({
      requester: req.user._id, reason, travelDate, departureTime,
      destination, numberOfBuses, estimatedRiders, notes,
    });
    res.status(201).json(request);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const getMyBusRequests = async (req, res) => {
  try { res.json(await svc.getMyBusRequestsService(req.user._id)); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

export const getAllBusRequests = async (req, res) => {
  try { res.json(await svc.getAllBusRequestsService()); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

export const reviewBusRequest = async (req, res) => {
  try {
    const { status, managerNote } = req.body;
    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ message: "status must be 'approved' or 'rejected'" });
    const request = await svc.reviewBusRequestService(req.params.id, { status, managerNote }, req.user._id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json(request);
  } catch (e) { res.status(400).json({ message: e.message }); }
};
