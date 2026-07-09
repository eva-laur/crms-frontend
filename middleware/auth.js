import jwt from "jsonwebtoken";
import User from "../modules/users/users.model.js";
import TokenBlacklist from "../modules/users/token-blacklist.model.js";
import { checkPermissionFromDB } from "../modules/permissions/permission.service.js";

/*
Tradeoffs:
- Permission checks come from MongoDB instead of hardcoded routes.
- In-memory cache avoids repeated DB reads.
- If permissions change, cache refreshes after 5 minutes.
*/

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query?.token) {
    // The live notification stream (GET /api/notifications/stream) is
    // consumed with the browser's EventSource API, which cannot set custom
    // request headers — so it authenticates via a "?token=" query param
    // instead. Only ever used as a fallback when no Authorization header is
    // present; every other endpoint keeps using the header as normal.
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const isBlacklisted = await TokenBlacklist.findOne({ token });

    if (isBlacklisted) {
      return res.status(401).json({
        message:
          "Token has been invalidated. Please log in again.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        message: "User no longer exists",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized",
    });
  }
};

const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const allowed = await checkPermissionFromDB(
        req.user.role,
        module,
        action
      );

      if (!allowed) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      next();
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Permission check failed",
      });
    }
  };
};

// Lets a request through if the target resource belongs to the requester
// themself (req.params.id === req.user._id), otherwise falls back to the
// normal DB-backed permission check. Used for routes like "update my own
// profile" that should never require an admin-only "manage" permission just
// to edit your own account, while still gating edits to *other* accounts
// behind that permission.
const allowSelfOrPermission = (module, action) => {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Authentication required" });
    if (req.params.id && req.params.id === req.user._id.toString()) return next();
    return checkPermission(module, action)(req, res, next);
  };
};

export { protect, checkPermission, allowSelfOrPermission };
export default protect;