import { logActionService } from "../modules/audit/audit.service.js";

// Map HTTP method + route to a readable action name
const getAction = (method, path) => {
  const p = path.replace(/\/[a-f0-9]{24}/g, "/:id"); // replace mongo IDs
  const map = {
    "POST /api/users/login":              "USER_LOGIN",
    "POST /api/users/logout":             "USER_LOGOUT",
    "POST /api/users/register":           "USER_REGISTER",
    "POST /api/bookings":                 "CREATE_BOOKING",
    "PATCH /api/bookings/:id/status":     "UPDATE_BOOKING_STATUS",
    "PATCH /api/bookings/:id/checkout":   "CHECKOUT_ITEM",
    "PATCH /api/bookings/:id/return":     "RETURN_ITEM",
    "PATCH /api/bookings/:id/cancel":     "CANCEL_BOOKING",
    "PATCH /api/bookings/:id/override":   "OVERRIDE_BOOKING",
    "POST /api/resources":                "CREATE_RESOURCE",
    "PUT /api/resources/:id":             "UPDATE_RESOURCE",
    "DELETE /api/resources/:id":          "DELETE_RESOURCE",
    "PATCH /api/resources/:id/maintenance":       "SET_MAINTENANCE",
    "PATCH /api/resources/:id/maintenance/clear": "CLEAR_MAINTENANCE",
    "POST /api/bus/reservations":               "CREATE_BUS_RESERVATION",
    "PATCH /api/bus/reservations/:id/cancel":   "CANCEL_BUS_RESERVATION",
    "POST /api/bus/mileage":                    "SUBMIT_FUEL_LOG",
    "PATCH /api/bus/mileage/:id/verify":        "VERIFY_FUEL_LOG",
    "POST /api/notifications":                  "SEND_NOTIFICATION",
    "DELETE /api/users/:id":              "DELETE_USER",
  };

  const key = `${method} ${p}`;
  return map[key] || `${method} ${p}`;
};

const getModule = (path) => {
  const parts = path.split("/");
  return parts[2] || "unknown"; // /api/<module>/...
};

export const auditLogger = (req, res, next) => {
  // Only log mutating requests
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();

  const originalJson = res.json.bind(res);

  res.json = (body) => {
    // Log after response is sent
    const actor   = req.user?._id || null;
    const role    = req.user?.role || "guest";

    // Extract target ID from params or response body
    const targetId = req.params?.id || body?._id || null;

    logActionService({
      actor,
      actorRole: role,
      action:    getAction(req.method, req.path),
      module:    getModule(req.path),
      targetId,
      // Controllers can set res.locals.auditDetails before responding (e.g.
      // overrideBooking sets { justification, displacedBookingIds }) to have
      // that payload recorded on this request's audit log entry. Defaults to
      // null, matching the previous behaviour, when a controller sets nothing.
      details:   res.locals.auditDetails || null,
      ip:        req.ip,
      status:    res.statusCode,
    });

    return originalJson(body);
  };

  next();
};
