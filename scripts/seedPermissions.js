import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Permission from "../modules/permissions/permission.model.js";

await mongoose.connect(process.env.MONGO_URI);

await Permission.deleteMany({});

// Every row here corresponds to an actual checkPermission(module, action) call
// found in a *.routes.js file. This list was built by grepping every route in
// the app and cross-checking against what each role could do before the
// permission system existed (admin-only / managerOnly / self-service /
// open-to-all-authenticated), so behaviour matches what was there previously
// — plus a few real gaps that were closed (e.g. students could view their own
// course progress/logbook before; that's restored here).
//
// Deliberately explicit instead of generated from a generic CRUD action list:
// the previous version's flatMap(["view","create","update","delete","manage",
// "analytics"]) produced action names that didn't match what several routes
// actually check for (e.g. "approve", "checkout", "reserve", "enroll",
// "view_overdue"), which silently locked everyone — including admin — out of
// most of the app. Explicit rows are slower to write but impossible to get
// subtly wrong this way: every row maps 1:1 to a real checkPermission() call.

const permissions = [
  // ── ADMIN — full access to every (module, action) pair that exists in the
  // route files. If a new checkPermission() call is added to a route later,
  // a matching row needs to be added here too (for every role that should
  // reach it) — that's the tradeoff of explicit rows over a generic flatMap.
  ...[
    ["attendance", "view"], ["attendance", "create"], ["attendance", "update"],
    ["bookings", "view"], ["bookings", "view_overdue"], ["bookings", "create"],
    ["bookings", "approve"], ["bookings", "checkout"], ["bookings", "return"],
    ["bookings", "cancel"], ["bookings", "override"],
    ["bus", "view"], ["bus", "reserve"], ["bus", "manage"], ["bus", "analytics"],
    ["course_progress", "view"], ["course_progress", "create"], ["course_progress", "update"],
    ["courses", "view"], ["courses", "manage"], ["courses", "enroll"],
    ["logbooks", "view"], ["logbooks", "create"], ["logbooks", "update"],
    ["reports", "view_course"], ["reports", "view_student"],
    ["resources", "view"], ["resources", "create"], ["resources", "update"], ["resources", "delete"],
    ["results", "view"], ["results", "create"], ["results", "update"],
    ["users", "view"], ["users", "manage"],
    ["audit", "view"],
    ["notifications", "send"],
    ["announcements", "view"], ["announcements", "create"],
    ["cancellations", "view"], ["cancellations", "create"],
    ["materials", "view"], ["materials", "create"], ["materials", "submit"],
  ].map(([module, action]) => ({ role: "admin", module, action, allowed: true })),

  // ── FACULTY ───────────────────────────────────────────────────────────────
  // Academic modules (unchanged from before this fix — these were seeded correctly)
  { role: "faculty", module: "attendance", action: "view" },
  { role: "faculty", module: "attendance", action: "create" },
  { role: "faculty", module: "attendance", action: "update" },
  { role: "faculty", module: "courses", action: "view" },
  { role: "faculty", module: "courses", action: "manage" },
  { role: "faculty", module: "courses", action: "enroll" },
  // Narrower than the admin-only "users:view" (full account list) — just
  // enough to look a student up by matricule when enrolling them in a
  // course, mirroring the checkout-desk lookup library/IT/lab managers get.
  { role: "faculty", module: "users", action: "lookup" },
  { role: "faculty", module: "course_progress", action: "view" },
  { role: "faculty", module: "course_progress", action: "create" },
  { role: "faculty", module: "course_progress", action: "update" },
  { role: "faculty", module: "logbooks", action: "view" },
  { role: "faculty", module: "logbooks", action: "create" },
  { role: "faculty", module: "logbooks", action: "update" },
  { role: "faculty", module: "results", action: "view" },
  { role: "faculty", module: "results", action: "create" },
  { role: "faculty", module: "results", action: "update" },
  { role: "faculty", module: "reports", action: "view_course" },
  { role: "faculty", module: "notifications", action: "send" },
  // Resource booking / bus — self-service, same rights as any authenticated
  // user (ownership of a specific booking/reservation is enforced in the
  // service layer, not here — see bookings.service.js / bus.service.js).
  { role: "faculty", module: "resources", action: "view" },
  { role: "faculty", module: "bookings", action: "view" },
  { role: "faculty", module: "bookings", action: "create" },
  { role: "faculty", module: "bookings", action: "checkout" },
  { role: "faculty", module: "bookings", action: "return" },
  { role: "faculty", module: "bookings", action: "cancel" },
  { role: "faculty", module: "bus", action: "view" },
  { role: "faculty", module: "bus", action: "reserve" },
  { role: "faculty", module: "bus", action: "request" },
  // Faculty post announcements/cancel classes for courses they teach
  // (ownership of the specific course is enforced in the controller, not here).
  { role: "faculty", module: "announcements", action: "view" },
  { role: "faculty", module: "announcements", action: "create" },
  { role: "faculty", module: "cancellations", action: "view" },
  { role: "faculty", module: "cancellations", action: "create" },
  { role: "faculty", module: "materials", action: "view" },
  { role: "faculty", module: "materials", action: "create" },

  // ── STUDENT ───────────────────────────────────────────────────────────────
  { role: "student", module: "courses", action: "view" },
  { role: "student", module: "results", action: "view" },
  { role: "student", module: "attendance", action: "view" },
  { role: "student", module: "reports", action: "view_student" },
  // Restored: students could view their own course progress / logbook
  // (student-view) before the permission system existed — these had no role
  // restriction at all on those specific routes.
  { role: "student", module: "course_progress", action: "view" },
  { role: "student", module: "logbooks", action: "view" },
  // Resource booking / bus — students are the primary users of this feature
  // per the spec (ST-01 through ST-08). Same self-service pattern as faculty.
  { role: "student", module: "resources", action: "view" },
  { role: "student", module: "bookings", action: "view" },
  { role: "student", module: "bookings", action: "create" },
  { role: "student", module: "bookings", action: "checkout" },
  { role: "student", module: "bookings", action: "return" },
  { role: "student", module: "bookings", action: "cancel" },
  { role: "student", module: "bus", action: "view" },
  // Fix: students previously only had bus:view, so both POST /bus/reservations
  // (reserve a seat) and GET /bus/reservations/my (their own reservations,
  // shown on the My Bookings page) were 403ing for every student, despite
  // the frontend already offering bus reservation as a student action.
  { role: "student", module: "bus", action: "reserve" },
  // Students read announcements/cancellations for their enrolled courses,
  // and can view + submit coursework materials (not create/post materials).
  { role: "student", module: "announcements", action: "view" },
  { role: "student", module: "cancellations", action: "view" },
  { role: "student", module: "materials", action: "view" },
  { role: "student", module: "materials", action: "submit" },

  // ── LIBRARY / IT / LAB MANAGERS ──────────────────────────────────────────
  // These 3 roles all manage the generic `resources` collection (scoped to
  // book/equipment/lab respectively, enforced in resources.controller.js —
  // the permission system here only knows about (module, action), not
  // resource *type*, so the type-level split happens at the controller, not
  // here). They share the same (module, action) shape; only `lab_manager`
  // additionally gets booking-conflict resolution since labs are time-slot
  // bookings that can clash, the way books/equipment checkouts don't.
  ...["library_manager", "it_manager", "lab_manager"].flatMap((role) => [
    { role, module: "resources", action: "view" },
    { role, module: "resources", action: "create" },
    { role, module: "resources", action: "update" },
    // Checkout-desk borrower lookup — narrower than the admin-only
    // "users:view" (full account list); just enough to identify a borrower
    // by matricule and check them out an item.
    { role, module: "users", action: "lookup" },
    // NOT resources:delete — that was admin-only before this permission system
    // existed too (router.delete("/:id", authorizeRoles("admin"), ...)), so
    // managers not having it is correct, not an oversight.
    { role, module: "bookings", action: "view" },
    { role, module: "bookings", action: "view_overdue" },
    { role, module: "bookings", action: "create" },
    { role, module: "bookings", action: "approve" },
    { role, module: "bookings", action: "checkout" },
    { role, module: "bookings", action: "return" },
    { role, module: "bookings", action: "cancel" },
    { role, module: "bookings", action: "override" },
    { role, module: "reports", action: "view_utilization" },
    { role, module: "audit", action: "view" },
  ]),

  // ── LOGISTICS / BUS MANAGER ──────────────────────────────────────────────
  // Manages the separate `bus` module instead of `resources` — buses aren't
  // Resource documents in this schema.
  { role: "logistics_manager", module: "bus", action: "view" },
  { role: "logistics_manager", module: "bus", action: "reserve" },
  { role: "logistics_manager", module: "bus", action: "manage" },
  { role: "logistics_manager", module: "bus", action: "analytics" },
  { role: "logistics_manager", module: "reports", action: "view_utilization" },
  { role: "logistics_manager", module: "audit", action: "view" },

  // Added for the new utilization-report endpoints (reports.routes.js):
  // GET /reports/utilization/by-resource and /by-type, gated by
  // checkPermission("reports", "view_utilization") — admin + the 4 manager
  // roles (granted above, per-role), since this is a management dashboard,
  // not student/faculty-facing.
  // NOTE: "reports":"view_course" for admin was already covered above by the
  // explicit admin block at the top of this file — not duplicated here.
  { role: "admin", module: "reports", action: "view_utilization" },
];

await Permission.insertMany(permissions.map((p) => ({ allowed: true, ...p })));

console.log(`Permissions seeded successfully (${permissions.length} rows)`);
process.exit();
