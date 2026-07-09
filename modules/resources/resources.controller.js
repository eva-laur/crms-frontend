import {
  createResourceService, getResourcesService, getResourceByIdService,
  updateResourceService, deleteResourceService,
  setMaintenanceService, clearMaintenanceService, toggleAvailabilityService,
} from "./resources.service.js";
import { ROLES, ROLE_RESOURCE_TYPE } from "../../shared/constants/roles.js";

// A library/IT/lab manager may only create or edit resources of the type
// they own (book/equipment/lab respectively). Admin is unrestricted.
// Returns an error message string, or null if the request is allowed.
const checkTypeScope = (role, requestedType) => {
  if (role === ROLES.ADMIN) return null;
  const scopedType = ROLE_RESOURCE_TYPE[role];
  if (!scopedType) return null; // role isn't a resource manager at all (route-level checkPermission already covers this)
  if (requestedType && requestedType !== scopedType) {
    return `As a ${role.replace("_", " ")}, you can only manage "${scopedType}" resources, not "${requestedType}".`;
  }
  return null;
};

export const createResource = async (req, res) => {
  try {
    // Default to the manager's own scope if they didn't specify a type.
    const scopedType = ROLE_RESOURCE_TYPE[req.user.role];
    const body = { ...req.body, type: req.body.type || scopedType };

    const scopeError = checkTypeScope(req.user.role, body.type);
    if (scopeError) return res.status(403).json({ message: scopeError });

    const resource = await createResourceService({ ...body, userId: req.user._id });
    res.status(201).json(resource);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const getResources = async (req, res) => {
  try {
    // ?type=book|equipment|lab|general&search=keyword (matches name/category/author)
    const resources = await getResourcesService(req.query.type, req.query.search);
    res.status(200).json(resources);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getResourceById = async (req, res) => {
  try {
    const resource = await getResourceByIdService(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    res.status(200).json(resource);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const updateResource = async (req, res) => {
  try {
    const existing = await getResourceByIdService(req.params.id);
    if (!existing) return res.status(404).json({ message: "Resource not found" });

    // Scope check against the resource's *current* type — and against the
    // new type too, in case the request tries to change it.
    const scopeError =
      checkTypeScope(req.user.role, existing.type) ||
      checkTypeScope(req.user.role, req.body.type);
    if (scopeError) return res.status(403).json({ message: scopeError });

    const resource = await updateResourceService(req.params.id, req.body);
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    res.status(200).json(resource);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const deleteResource = async (req, res) => {
  try {
    const resource = await deleteResourceService(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    res.status(200).json({ message: "Resource deleted successfully" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const setMaintenance = async (req, res) => {
  try {
    const existing = await getResourceByIdService(req.params.id);
    if (!existing) return res.status(404).json({ message: "Resource not found" });
    const scopeError = checkTypeScope(req.user.role, existing.type);
    if (scopeError) return res.status(403).json({ message: scopeError });

    const resource = await setMaintenanceService(req.params.id, req.body);
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    res.status(200).json(resource);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const clearMaintenance = async (req, res) => {
  try {
    const existing = await getResourceByIdService(req.params.id);
    if (!existing) return res.status(404).json({ message: "Resource not found" });
    const scopeError = checkTypeScope(req.user.role, existing.type);
    if (scopeError) return res.status(403).json({ message: scopeError });

    const resource = await clearMaintenanceService(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    res.status(200).json(resource);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const toggleAvailability = async (req, res) => {
  try {
    const existing = await getResourceByIdService(req.params.id);
    if (!existing) return res.status(404).json({ message: "Resource not found" });
    const scopeError = checkTypeScope(req.user.role, existing.type);
    if (scopeError) return res.status(403).json({ message: scopeError });

    const resource = await toggleAvailabilityService(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    res.status(200).json(resource);
  } catch (error) { res.status(400).json({ message: error.message }); }
};
