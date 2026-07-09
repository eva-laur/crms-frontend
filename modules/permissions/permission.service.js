import Permission from "./permission.model.js";

/*
Tradeoffs:
- 5-minute TTL cache reduces Mongo hits; cache refreshes on expiry.
- admin is unconditionally allowed — this is a system invariant, not a DB row.
  An admin who can't act because seed:permissions hasn't run (or ran against
  old role names) would lock out the person who needs to fix it.
*/

const permissionCache = new Map();
const TTL = 5 * 60 * 1000;

export const checkPermissionFromDB = async (role, module, action) => {
  // Admin bypasses the DB lookup entirely — always allowed.
  if (role === "admin") return true;

  const key = `${role}:${module}:${action}`;
  const cached = permissionCache.get(key);

  if (cached && Date.now() - cached.timestamp < TTL) {
    return cached.allowed;
  }

  const permission = await Permission.findOne({ role, module, action });
  const allowed = permission?.allowed || false;

  permissionCache.set(key, { allowed, timestamp: Date.now() });
  return allowed;
};

/** Clears the in-memory permission cache — call after seeding or changing
 *  permission rows so the new values take effect without waiting for the TTL. */
export const clearPermissionCache = () => permissionCache.clear();
