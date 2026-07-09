import AuditLog from "./audit.model.js";
import Resource from "../resources/resources.model.js";
import Booking from "../bookings/bookings.model.js";

export const logActionService = async ({ actor, actorRole, action, module, targetId, details, ip, status }) => {
  try {
    await AuditLog.create({ actor, actorRole, action, module, targetId, details, ip, status });
  } catch {
    // Never let audit logging break the main request
  }
};

// Resource type each scoped manager role is allowed to see audit activity
// for — matches the same book/equipment/lab split already enforced on the
// /resources and /bookings routes themselves (see resources.controller.js
// and scripts/seedPermissions.js). `null` (logistics_manager) means "not
// resource-scoped at all — scoped by module instead", handled separately.
const MANAGER_RESOURCE_TYPE = {
  library_manager: "book",
  it_manager: "equipment",
  lab_manager: "lab",
};

/**
 * Builds the extra Mongo filter that restricts a manager's audit feed to
 * "what they manage" — admin gets no filter (sees everything, as required).
 * The AuditLog schema only stores a coarse `module` (the URL's first path
 * segment, e.g. "resources"/"bookings"/"bus") and a `targetId`, not a
 * resource *type* — so for library/IT/lab managers we first resolve which
 * Resource/Booking IDs belong to their domain, then scope by those IDs.
 */
async function buildRoleScopeFilter(role) {
  if (role === "admin") return null; // unscoped — sees every audit log

  if (role === "logistics_manager") {
    return { module: "bus" };
  }

  const resourceType = MANAGER_RESOURCE_TYPE[role];
  if (!resourceType) {
    // Any other role that somehow reaches this endpoint (shouldn't happen —
    // checkPermission("audit","view") only grants admin + these 4 manager
    // roles) sees nothing, rather than accidentally seeing everything.
    return { _id: null };
  }

  const resourceIds = await Resource.find({ type: resourceType }).distinct("_id");
  const bookingIds = await Booking.find({ resource: { $in: resourceIds } }).distinct("_id");

  return {
    $or: [
      { module: "resources", targetId: { $in: resourceIds } },
      { module: "bookings", targetId: { $in: bookingIds } },
    ],
  };
}

export const getAuditLogsService = async ({ role, module, actor, startDate, endDate, page = 1, limit = 50 }) => {
  const filter = {};
  if (module)    filter.module = module;
  if (actor)     filter.actor  = actor;
  if (startDate && endDate) filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };

  const scopeFilter = await buildRoleScopeFilter(role);
  const finalFilter = scopeFilter ? { $and: [filter, scopeFilter] } : filter;

  const total = await AuditLog.countDocuments(finalFilter);
  const logs  = await AuditLog.find(finalFilter)
    .populate("actor", "name email role")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  return { total, page: Number(page), pages: Math.ceil(total / limit), logs };
};
