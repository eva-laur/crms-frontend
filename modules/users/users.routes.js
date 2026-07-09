import express from "express";
import {
  createUser, loginUser, logoutUser, changePassword,
  getProfile, getAllUsers, getUserById, updateUser, deleteUser,
  lookupUserByMatricule,
} from "./users.controller.js";

import { protect, checkPermission, allowSelfOrPermission } from "../../middleware/auth.js";

const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);

router.post("/logout", protect, logoutUser);
router.patch("/change-password", protect, changePassword);
router.get("/profile", protect, getProfile);

// Checkout-desk lookup — separate, narrower permission from "users:view"
// (admin-only) since library/IT/lab managers need this to identify a
// borrower by matricule, but shouldn't get the full user-management list.
router.get("/lookup/:matricule", protect, checkPermission("users", "lookup"), lookupUserByMatricule);

router.get("/", protect, checkPermission("users", "view"), getAllUsers);
router.get("/:id", protect, checkPermission("users", "view"), getUserById);

router.put("/:id", protect, allowSelfOrPermission("users", "manage"), updateUser);
router.delete("/:id", protect, checkPermission("users", "manage"), deleteUser);

export default router;