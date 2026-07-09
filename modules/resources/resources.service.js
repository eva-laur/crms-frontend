import Resource from "./resources.model.js";
import { ROLES, RESOURCE_MANAGER_ROLES } from "../../shared/constants/roles.js";

// Borrowing limits per role (for books). Admin and any resource-manager
// role get the same generous limit as before (previously just "resource_manager").
const BORROW_LIMITS = {
  [ROLES.STUDENT]: 5,
  [ROLES.FACULTY]: 8,
  [ROLES.ADMIN]: 99,
  ...Object.fromEntries(RESOURCE_MANAGER_ROLES.map((r) => [r, 99])),
};

export const createResourceService = async ({ name, type, category, location, quantity, isbn, author, totalCopies, brand, speciality, level, assetTag, condition, userId }) => {
  const data = { name, type, category, location, quantity, brand, speciality, level, assetTag, condition, createdBy: userId };

  if (type === "book") {
    data.isbn           = isbn;
    data.author         = author;
    data.totalCopies    = totalCopies || quantity || 1;
    data.availableCopies = totalCopies || quantity || 1;
  }

  return await Resource.create(data);
};

export const getResourceByIdService = async (id) =>
  await Resource.findById(id).populate("createdBy", "name email role");

export const updateResourceService = async (id, updates) =>
  await Resource.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

export const deleteResourceService = async (id) =>
  await Resource.findByIdAndDelete(id);

// ── MAINTENANCE ───────────────────────────────────────────────────────────────

export const setMaintenanceService = async (id, { maintenanceNote }) => {
  const resource = await Resource.findById(id);
  if (!resource) return null;
  resource.status          = "under_maintenance";
  resource.maintenanceNote = maintenanceNote || "Under maintenance";
  await resource.save();
  return resource;
};

export const clearMaintenanceService = async (id) => {
  const resource = await Resource.findById(id);
  if (!resource) return null;
  resource.status          = "available";
  resource.maintenanceNote = null;
  await resource.save();
  return resource;
};

// ── AVAILABILITY TOGGLE (nonmaintenance) ─────────────────────────────────────

export const toggleAvailabilityService = async (id) => {
  const resource = await Resource.findById(id);
  if (!resource) return null;
  if (resource.status === "under_maintenance") {
    throw new Error("Cannot toggle availability while resource is under maintenance");
  }
  resource.status = resource.status === "available" ? "unavailable" : "available";
  await resource.save();
  return resource;
};

// ── BOOKSPECIFIC ─────────────────────────────────────────────────────────────

export const getBorrowLimitService = (role) => BORROW_LIMITS[role] || 3;

export const getActiveBorrowCountService = async (Booking, userId) => {
  return await Booking.countDocuments({
    user:   userId,
    status: { $in: ["approved", "checked_out"] },
  });
};

export const getResourcesService = async (type, search) => {
  const query = {};

  if (type) {
    query.type = type;
  }

  if (search && search.trim()) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { author: { $regex: search, $options: "i" } },
    ];
  }

  return await Resource.find(query)
    .populate("createdBy", "name email role")
    .sort({ createdAt: 1 });
};