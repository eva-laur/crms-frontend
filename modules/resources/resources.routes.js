import express from "express";
import {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  setMaintenance,
  clearMaintenance,
  toggleAvailability,
} from "./resources.controller.js";

import { protect, checkPermission } from "../../middleware/auth.js";

const router = express.Router();

router.get(
  "/",
  protect,
  checkPermission("resources", "view"),
  getResources
);

router.get(
  "/:id",
  protect,
  checkPermission("resources", "view"),
  getResourceById
);

router.post(
  "/",
  protect,
  checkPermission("resources", "create"),
  createResource
);

router.put(
  "/:id",
  protect,
  checkPermission("resources", "update"),
  updateResource
);

router.delete(
  "/:id",
  protect,
  checkPermission("resources", "delete"),
  deleteResource
);

router.patch(
  "/:id/availability",
  protect,
  checkPermission("resources", "update"),
  toggleAvailability
);

router.patch(
  "/:id/maintenance",
  protect,
  checkPermission("resources", "update"),
  setMaintenance
);

router.patch(
  "/:id/maintenance/clear",
  protect,
  checkPermission("resources", "update"),
  clearMaintenance
);

export default router;