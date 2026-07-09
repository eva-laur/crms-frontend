import { Bus, Route, BusReservation, BusRequest } from "./bus.model.js";

// ─── BUS FLEET ────────────────────────────────────────────────────────────────

export const createBusService = async (data) => await Bus.create(data);

export const getBusesService = async () => await Bus.find().sort({ createdAt: -1 });

export const updateBusService = async (id, data) =>
  await Bus.findByIdAndUpdate(id, data, { new: true, runValidators: true });

export const deleteBusService = async (id) => await Bus.findByIdAndDelete(id);

// ─── ROUTES ───────────────────────────────────────────────────────────────────

export const createRouteService = async (data) => await Route.create(data);

export const getRoutesService = async () =>
  await Route.find({ isActive: true }).populate("bus").sort({ name: 1 });

export const getRouteByIdService = async (id) =>
  await Route.findById(id).populate("bus");

export const updateRouteService = async (id, data) =>
  await Route.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate("bus");

export const deleteRouteService = async (id) => await Route.findByIdAndDelete(id);

// ─── SEAT AVAILABILITY ────────────────────────────────────────────────────────

export const getSeatAvailabilityService = async (routeId, travelDate) => {
  const route = await Route.findById(routeId).populate("bus");
  if (!route) return null;

  const startOfDay = new Date(travelDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(travelDate);
  endOfDay.setHours(23, 59, 59, 999);

  const reservations = await BusReservation.find({
    route: routeId,
    travelDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ["pending", "confirmed"] },
  });

  const bookedSeats = reservations.map((r) => r.seatNumber);
  const totalSeats  = route.bus.capacity;
  const allSeats    = Array.from({ length: totalSeats }, (_, i) => i + 1);
  const freeSeats   = allSeats.filter((s) => !bookedSeats.includes(s));

  return {
    route,
    travelDate,
    totalSeats,
    bookedSeats,
    availableSeats: freeSeats,
    availableCount: freeSeats.length,
  };
};

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────

export const createReservationService = async ({ routeId, passengerId, travelDate, seatNumber }) => {
  // Check if seat is already taken
  const startOfDay = new Date(travelDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(travelDate);
  endOfDay.setHours(23, 59, 59, 999);

  const conflict = await BusReservation.findOne({
    route: routeId,
    travelDate: { $gte: startOfDay, $lte: endOfDay },
    seatNumber,
    status: { $in: ["pending", "confirmed"] },
  });

  if (conflict) throw new Error(`Seat ${seatNumber} is already booked for this route and date`);

  return await BusReservation.create({
    route: routeId,
    passenger: passengerId,
    travelDate,
    seatNumber,
    status: "pending",
  });
};

export const getMyReservationsService = async (passengerId) =>
  await BusReservation.find({ passenger: passengerId })
    .populate("route")
    .sort({ travelDate: -1 });

export const getAllReservationsService = async () =>
  await BusReservation.find()
    .populate("route")
    .populate("passenger", "name email role")
    .sort({ travelDate: -1 });

export const cancelReservationService = async (reservationId, passengerId, isAdmin) => {
  const reservation = await BusReservation.findById(reservationId);
  if (!reservation) return null;

  // Only the owner or admin can cancel
  if (!isAdmin && reservation.passenger.toString() !== passengerId.toString()) {
    throw new Error("You are not authorised to cancel this reservation");
  }

  // Must be ≥2 hours before departure
  const route = await Route.findById(reservation.route);
  const [hours, minutes] = route.departureTime.split(":").map(Number);
  const departure = new Date(reservation.travelDate);
  departure.setHours(hours, minutes, 0, 0);
  const now = new Date();
  const diffHours = (departure - now) / (1000 * 60 * 60);

  if (diffHours < 2 && !isAdmin) {
    throw new Error("Cancellations must be made at least 2 hours before departure");
  }

  reservation.status = "cancelled";
  await reservation.save();
  return reservation;
};

// Manager/admin confirms a pending reservation — e.g. after verifying payment
// or eligibility. A reservation already holds its seat the moment it's
// created (the pending/confirmed collision check in createReservationService
// prevents anyone else from grabbing the same seat in the meantime), so
// confirming doesn't re-check availability — it's a status transition, not a
// new booking.
export const confirmReservationService = async (reservationId) => {
  const reservation = await BusReservation.findById(reservationId);
  if (!reservation) return null;
  if (reservation.status !== "pending") {
    throw new Error(`Only pending reservations can be confirmed (this one is "${reservation.status}")`);
  }
  reservation.status = "confirmed";
  await reservation.save();
  return reservation;
};

// ─── REPORTS ─────────────────────────────────────────────────────────────────

export const getBusOccupancyReportService = async (routeId, startDate, endDate) => {
  const query = { status: "confirmed" };
  if (routeId) query.route = routeId;
  if (startDate && endDate) {
    query.travelDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const reservations = await BusReservation.find(query)
    .populate("route")
    .populate("passenger", "name email role");

  // Group by route + date
  const grouped = {};
  for (const r of reservations) {
    const key = `${r.route?.name}_${r.travelDate.toDateString()}`;
    if (!grouped[key]) {
      grouped[key] = { route: r.route?.name, date: r.travelDate, passengers: 0, capacity: r.route?.bus?.capacity || 0 };
    }
    grouped[key].passengers++;
  }

  const summary = Object.values(grouped).map((g) => ({
    ...g,
    occupancyRate: g.capacity > 0 ? `${((g.passengers / g.capacity) * 100).toFixed(1)}%` : "N/A",
  }));

  return { totalReservations: reservations.length, summary };
};

// ─── BUS REQUESTS ─────────────────────────────────────────────────────────────

export const createBusRequestService = async (data) =>
  await BusRequest.create(data);

export const getMyBusRequestsService = async (requesterId) =>
  await BusRequest.find({ requester: requesterId })
    .populate("requester", "name email matricule role")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 });

export const getAllBusRequestsService = async () =>
  await BusRequest.find()
    .populate("requester", "name email matricule role")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 });

export const reviewBusRequestService = async (requestId, { status, managerNote }, reviewerId) => {
  const req = await BusRequest.findById(requestId);
  if (!req) return null;
  if (req.status !== "pending") throw new Error(`This request is already ${req.status}`);
  req.status = status;
  req.managerNote = managerNote ?? null;
  req.reviewedBy = reviewerId;
  req.reviewedAt = new Date();
  await req.save();
  return req;
};
