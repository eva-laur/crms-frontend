// Canonical role list — single source of truth on the backend.
// Mirrors the frontend's ROLES in client/src/lib/role-context.tsx exactly.
// (Previously this file defined a generic "resourceManager" role that
// didn't match the frontend's 4 distinct manager roles, and wasn't even
// imported anywhere -- every other file hardcoded "resource_manager"
// instead. This version is the real, used, single source of truth.)

export const ROLES = {
  STUDENT: "student",
  FACULTY: "faculty",
  ADMIN: "admin",
  LIBRARY_MANAGER: "library_manager",
  LOGISTICS_MANAGER: "logistics_manager",
  IT_MANAGER: "it_manager",
  LAB_MANAGER: "lab_manager",
};

export const ALL_ROLES = Object.values(ROLES);

// The 4 "manager" roles as a group (used for nav/permission grouping on the frontend).
export const MANAGER_ROLES = [
  ROLES.LIBRARY_MANAGER,
  ROLES.LOGISTICS_MANAGER,
  ROLES.IT_MANAGER,
  ROLES.LAB_MANAGER,
];

// Of those, the ones that manage the generic `resources` collection
// (library/IT/lab). Logistics manages the separate `bus` module instead.
export const RESOURCE_MANAGER_ROLES = [
  ROLES.LIBRARY_MANAGER,
  ROLES.IT_MANAGER,
  ROLES.LAB_MANAGER,
];

// Which `resources.type` each resource-manager role is scoped to.
// Used to stop e.g. a library_manager from creating/editing `equipment`.
export const ROLE_RESOURCE_TYPE = {
  [ROLES.LIBRARY_MANAGER]: "book",
  [ROLES.IT_MANAGER]: "equipment",
  [ROLES.LAB_MANAGER]: "lab",
};

/** Admin or any of the 4 manager roles -- replaces every old
 *  `["admin", "resource_manager"].includes(role)` check in the codebase. */
export const isStaff = (role) => role === ROLES.ADMIN || MANAGER_ROLES.includes(role);

/** Admin or a manager of the generic `resources` collection (not logistics). */
export const isResourceManager = (role) =>
  role === ROLES.ADMIN || RESOURCE_MANAGER_ROLES.includes(role);

/** Admin or the logistics/bus manager. */
export const isBusManager = (role) => role === ROLES.ADMIN || role === ROLES.LOGISTICS_MANAGER;
