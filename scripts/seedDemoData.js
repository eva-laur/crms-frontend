import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../modules/users/users.model.js";
import Resource from "../modules/resources/resources.model.js";
import Booking from "../modules/bookings/bookings.model.js";
import { Bus, Route, BusReservation, FuelLog } from "../modules/bus/bus.model.js";
import Course from "../modules/courses/courses.model.js";
import Attendance from "../modules/attendance/attendance.model.js";
import Result from "../modules/results/results.model.js";
import CourseProgress from "../modules/course-progress/courseProgress.model.js";
import Logbook from "../modules/logbooks/logbooks.model.js";
import Notification from "../modules/notifications/notifications.model.js";

/*
Populates realistic catalog data (books, IT equipment, labs, halls, buses)
and a spread of booking history — but that history is only ever attached to
the 7 seeded DEMO accounts (see seedDemoUsers.js). Anyone who registers for
real through the app gets zero bookings, zero loans, zero reservations —
there is nothing in this script that touches any other user. Re-running this
script is safe: it checks for one marker resource and exits early if the
catalog already exists, rather than duplicating everything.

Run after seedDemoUsers.js — this script looks demo users up by their seeded
emails and fails fast with a clear message if they're missing.
*/

await mongoose.connect(process.env.MONGO_URI);

const already = await Resource.findOne({ assetTag: "PRJ-018" });
if (already) {
  console.log("Demo catalog already seeded — nothing to do. Delete resources/bookings manually first if you want to reseed.");
  process.exit();
}

const demo = {};
const EMAILS = {
  student: "amira.kone@iuc.edu",
  faculty: "s.etoa@iuc.edu",
  library_manager: "m.owono@iuc.edu",
  logistics_manager: "p.diallo@iuc.edu",
  it_manager: "e.nkomo@iuc.edu",
  lab_manager: "s.mballa@iuc.edu",
  admin: "j.mbarga@iuc.edu",
};
for (const [role, email] of Object.entries(EMAILS)) {
  const u = await User.findOne({ email });
  if (!u) {
    console.error(`Demo user "${email}" (${role}) not found — run "npm run seed:demo" first.`);
    process.exit(1);
  }
  demo[role] = u;
}

const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

// ── BOOKS ───────────────────────────────────────────────────────────────────
const books = await Resource.insertMany([
  { name: "Introduction to Algorithms",       author: "Cormen, Leiserson, Rivest", isbn: "978-0262033848", type: "book", category: "Textbook",        speciality: "Computer Science",   level: "L3",    location: "Central Library", quantity: 8,  totalCopies: 8, availableCopies: 8, createdBy: demo.library_manager._id },
  { name: "Distributed Systems: Principles",  author: "Tanenbaum & Van Steen",     isbn: "978-1543057386", type: "book", category: "Textbook",        speciality: "Computer Science",   level: "M1",    location: "Central Library", quantity: 6,  totalCopies: 6, availableCopies: 6, createdBy: demo.library_manager._id },
  { name: "Signals and Systems",              author: "Oppenheim & Willsky",       isbn: "978-0138147570", type: "book", category: "Textbook",        speciality: "Electrical Eng.",    level: "L2",    location: "Central Library", quantity: 5,  totalCopies: 5, availableCopies: 5, createdBy: demo.library_manager._id },
  { name: "MSc CS · Defense Report (2025)",   author: "A. Tchoumi",                isbn: "REP-CS-25-014",  type: "book", category: "Academic Report", speciality: "Computer Science",   level: "M2",    location: "Central Library", quantity: 2,  totalCopies: 2, availableCopies: 2, createdBy: demo.library_manager._id },
  { name: "PhD Thesis · Power Grids",         author: "Dr. K. Owusu",              isbn: "REP-EE-24-002",  type: "book", category: "Academic Report", speciality: "Electrical Eng.",    level: "PhD",   location: "Central Library", quantity: 1,  totalCopies: 1, availableCopies: 1, createdBy: demo.library_manager._id },
  { name: "Things Fall Apart",                author: "Chinua Achebe",             isbn: "978-0385474542", type: "book", category: "Novel",           speciality: "General Literature", level: "General", location: "Central Library", quantity: 4, totalCopies: 4, availableCopies: 4, createdBy: demo.library_manager._id },
  { name: "Une si longue lettre",             author: "Mariama Bâ",                isbn: "978-2724237917", type: "book", category: "Novel",           speciality: "General Literature", level: "General", location: "Central Library", quantity: 3, totalCopies: 3, availableCopies: 3, createdBy: demo.library_manager._id },
  { name: "Engineering Mathematics",          author: "K.A. Stroud",               isbn: "978-1352010275", type: "book", category: "Reference",       speciality: "Mathematics",         level: "L1",    location: "Central Library", quantity: 7,  totalCopies: 7, availableCopies: 7, createdBy: demo.library_manager._id },
  { name: "Computer Networks",                author: "Andrew Tanenbaum",          isbn: "978-0132126953", type: "book", category: "Textbook",        speciality: "Computer Science",   level: "L2",    location: "Central Library", quantity: 6,  totalCopies: 6, availableCopies: 6, createdBy: demo.library_manager._id },
  { name: "BSc EE · Internship Report",       author: "M. Ngono",                  isbn: "REP-EE-25-031",  type: "book", category: "Academic Report", speciality: "Electrical Eng.",    level: "L3",    location: "Central Library", quantity: 2,  totalCopies: 2, availableCopies: 2, createdBy: demo.library_manager._id },
]);

// ── IT EQUIPMENT ─────────────────────────────────────────────────────────────
const equipment = await Resource.insertMany([
  { name: "Epson EB-2247U",      assetTag: "PRJ-018",  type: "equipment", category: "Projector",  brand: "Epson",  condition: "Excellent", location: "AV Cage · A",  quantity: 6,  createdBy: demo.it_manager._id },
  { name: "BenQ MW560",          assetTag: "PRJ-022",  type: "equipment", category: "Projector",  brand: "BenQ",   condition: "Worn",      location: "Amphi B",      quantity: 3,  createdBy: demo.it_manager._id },
  { name: "Sony A7 IV",          assetTag: "CAM-A7",   type: "equipment", category: "Camera",     brand: "Sony",   condition: "Excellent", location: "AV Cage · B",  quantity: 2,  createdBy: demo.it_manager._id },
  { name: "Nikon Z6 II",         assetTag: "CAM-Z6",   type: "equipment", category: "Camera",     brand: "Nikon",  condition: "Good",      location: "Media Lab",    quantity: 1,  createdBy: demo.it_manager._id },
  { name: "Lenovo ThinkPad X1",  assetTag: "LAP-X1",   type: "equipment", category: "Laptop",     brand: "Lenovo", condition: "Good",      location: "IT Vault",     quantity: 12, createdBy: demo.it_manager._id },
  { name: "MacBook Pro 14 M3",   assetTag: "LAP-MB",   type: "equipment", category: "Laptop",     brand: "Apple",  condition: "Excellent", location: "Repair Bench", quantity: 4,  status: "under_maintenance", maintenanceNote: "Battery swap in progress", createdBy: demo.it_manager._id },
  { name: "Shure SM7B",          assetTag: "MIC-SM7",  type: "equipment", category: "Microphone", brand: "Shure",  condition: "Excellent", location: "Studio S-1",   quantity: 2,  createdBy: demo.it_manager._id },
  { name: "Rode Wireless GO II", assetTag: "MIC-LAV",  type: "equipment", category: "Microphone", brand: "Rode",   condition: "Good",      location: "AV Cage · C",  quantity: 5,  createdBy: demo.it_manager._id },
  { name: "LG 55\" UHD Display", assetTag: "DSP-55",   type: "equipment", category: "Display",    brand: "LG",     condition: "Good",      location: "Meeting M-3",  quantity: 8,  createdBy: demo.it_manager._id },
  { name: "iPad Air (5th gen)",  assetTag: "TAB-IP",   type: "equipment", category: "Tablet",     brand: "Apple",  condition: "Excellent", location: "IT Vault",     quantity: 10, createdBy: demo.it_manager._id },
]);

// ── LABS & HALLS (type: lab / general) ───────────────────────────────────────
const labs = await Resource.insertMany([
  { name: "Lab L-204",        type: "lab",     category: "Computer Lab", location: "Block C, 2nd Floor", quantity: 1, createdBy: demo.lab_manager._id },
  { name: "Lab L-301",        type: "lab",     category: "Electronics Lab", location: "Block C, 3rd Floor", quantity: 1, createdBy: demo.lab_manager._id },
  { name: "Amphi A",          type: "general", category: "Lecture Hall", location: "Main Block, Ground Floor", quantity: 1, createdBy: demo.admin._id },
  { name: "Amphi B",          type: "general", category: "Lecture Hall", location: "Main Block, 1st Floor", quantity: 1, createdBy: demo.admin._id },
  { name: "Meeting Room M-3", type: "general", category: "Meeting Room", location: "Admin Block, 2nd Floor", quantity: 1, createdBy: demo.admin._id },
]);

const byTag = (tag) => equipment.find(r => r.assetTag === tag);
const byIsbn = (isbn) => books.find(r => r.isbn === isbn);

// ── BOOKING HISTORY (demo accounts only) ─────────────────────────────────────
// Direct Booking.create() calls, bypassing the service-layer guards used by
// the live app (borrow limits, conflict checks) since this is trusted seed
// data, not a user-submitted request. availableCopies is adjusted by hand
// below to stay consistent with each booking's status, since we're skipping
// checkOutService/returnItemService's $inc side-effects too.

const bookingDefs = [
  // Amira (student) — one returned, one checked out, one overdue
  { resource: byIsbn("978-1543057386"), user: demo.student, status: "checked_out", checkOutDate: daysFromNow(-5), dueDate: daysFromNow(9), purpose: "Library checkout — Distributed Systems: Principles" },
  { resource: byIsbn("978-0262033848"), user: demo.student, status: "returned", checkOutDate: daysFromNow(-20), returnDate: daysFromNow(-6), dueDate: daysFromNow(-6), returnCondition: "Excellent", purpose: "Library checkout — Introduction to Algorithms" },
  { resource: byTag("CAM-Z6"),           user: demo.student, status: "overdue", checkOutDate: daysFromNow(-10), dueDate: daysFromNow(-3), purpose: "Final-year project shoot" },
  // Amira's pending request awaiting library_manager approval
  { resource: byIsbn("REP-CS-25-014"),   user: demo.student, status: "pending", dueDate: daysFromNow(14), purpose: "Library checkout — MSc CS Defense Report" },

  // Dr. Etoa (faculty)
  { resource: byIsbn("REP-EE-24-002"),  user: demo.faculty, status: "checked_out", checkOutDate: daysFromNow(-2), dueDate: daysFromNow(12), purpose: "Library checkout — PhD Thesis: Power Grids" },
  { resource: byTag("PRJ-022"),         user: demo.faculty, status: "checked_out", checkOutDate: daysFromNow(-1), dueDate: daysFromNow(2),  purpose: "CS-401 lecture · Amphi A" },
  { resource: byTag("MIC-SM7"),         user: demo.faculty, status: "returned", checkOutDate: daysFromNow(-14), returnDate: daysFromNow(-12), dueDate: daysFromNow(-12), returnCondition: "Good", purpose: "Guest lecture recording" },
  { resource: byTag("LAP-X1"),          user: demo.faculty, status: "approved", dueDate: daysFromNow(7), purpose: "Grading workshop laptop" },

  // A lab booking with a real time slot (so the schedule/conflict pages have
  // something real to read once they're wired)
  { resource: labs[0], user: demo.faculty, status: "approved", startTime: daysFromNow(2), endTime: new Date(daysFromNow(2).getTime() + 2 * 3600 * 1000), purpose: "EE-220 Practical · 32 students" },
  // Two competing PENDING lab bookings on the same lab at an overlapping time —
  // this gives the lab_manager a real conflict to resolve in the Conflict
  // Resolution Centre the moment they log in.
  { resource: labs[0], user: demo.student, status: "pending", startTime: new Date(daysFromNow(3).setUTCHours(10, 0, 0, 0)), endTime: new Date(daysFromNow(3).setUTCHours(12, 0, 0, 0)), purpose: "CS-401 Lab Session · Group A" },
  { resource: labs[0], user: demo.faculty, status: "pending", startTime: new Date(daysFromNow(3).setUTCHours(11, 0, 0, 0)), endTime: new Date(daysFromNow(3).setUTCHours(13, 0, 0, 0)), purpose: "Research data collection · EE-lab" },
];

for (const def of bookingDefs) {
  await Booking.create(def);
  // Keep book availableCopies consistent with status, since we bypassed
  // checkOutService/returnItemService here.
  if (def.resource.type === "book" && ["checked_out", "overdue"].includes(def.status)) {
    def.resource.availableCopies -= 1;
    await def.resource.save();
  }
}

// ── BUS FLEET ─────────────────────────────────────────────────────────────────
const buses = await Bus.insertMany([
  { plateNumber: "CE-4471-IUC", model: "Toyota Coaster",  capacity: 28, status: "active" },
  { plateNumber: "CE-4472-IUC", model: "Mercedes Sprinter", capacity: 18, status: "active" },
  { plateNumber: "CE-4473-IUC", model: "Hyundai County",  capacity: 22, status: "under_maintenance" },
]);

const routes = await Route.insertMany([
  { name: "Campus ↔ Downtown",  origin: "Main Campus Gate", destination: "Downtown Terminal", stops: ["City Hall", "Central Market"], departureTime: "07:30", estimatedArrival: "08:15", distanceKm: 14, bus: buses[0]._id, daysOfOperation: ["Mon","Tue","Wed","Thu","Fri"] },
  { name: "Campus ↔ Student Residences", origin: "Main Campus Gate", destination: "Residence Hall B", stops: [], departureTime: "17:45", estimatedArrival: "18:05", distanceKm: 6, bus: buses[1]._id, daysOfOperation: ["Mon","Tue","Wed","Thu","Fri","Sat"] },
]);

await BusReservation.insertMany([
  { route: routes[0]._id, passenger: demo.student._id, travelDate: daysFromNow(1), seatNumber: 12, status: "confirmed" },
  { route: routes[1]._id, passenger: demo.faculty._id, travelDate: daysFromNow(1), seatNumber: 4,  status: "confirmed" },
  { route: routes[0]._id, passenger: demo.student._id, travelDate: daysFromNow(-3), seatNumber: 9, status: "cancelled" },
  { route: routes[0]._id, passenger: demo.faculty._id, travelDate: daysFromNow(2), seatNumber: 7,  status: "pending" },
]);

await FuelLog.create({
  bus: buses[0]._id, route: routes[0]._id, date: daysFromNow(-2),
  driver: "Jean-Paul Biya", startOdometer: 84210, endOdometer: 84224,
  fuelFilled: 12, pricePerLitre: 850, submittedBy: demo.logistics_manager._id,
  verification: { status: "verified", verifiedBy: demo.logistics_manager._id, verifiedAt: daysFromNow(-2) },
});

// ── COURSE (real enrollment — powers Announcements, Results, Course
// Progress, Logbook pages) ────────────────────────────────────────────────
const course = await Course.create({
  courseCode: "CS-401",
  title: "Distributed Systems",
  description: "Consensus, replication, and fault tolerance in distributed systems.",
  lecturer: demo.faculty._id,
  students: [demo.student._id],
  semester: "Semester 2",
  academicYear: "2025/2026",
});

// ── ATTENDANCE ────────────────────────────────────────────────────────────
await Attendance.create({
  course: course._id, lecturer: demo.faculty._id, date: daysFromNow(-7),
  records: [{ student: demo.student._id, status: "present" }],
});
await Attendance.create({
  course: course._id, lecturer: demo.faculty._id, date: daysFromNow(-2),
  records: [{ student: demo.student._id, status: "late" }],
});

// ── RESULTS (grades) ─────────────────────────────────────────────────────
const result = await Result.create({
  student: demo.student._id, course: course._id, lecturer: demo.faculty._id,
  assessments: [
    { title: "Quiz 1 — CAP theorem",        type: "quiz",       score: 8,  totalMarks: 10 },
    { title: "Midterm test",                type: "test",       score: 34, totalMarks: 40 },
    { title: "Assignment 1 — Raft demo",    type: "assignment", score: 18, totalMarks: 20 },
  ],
});
{
  const totalScore    = result.assessments.reduce((s, a) => s + a.score, 0);
  const totalPossible = result.assessments.reduce((s, a) => s + a.totalMarks, 0);
  const finalScore = (totalScore / totalPossible) * 100;
  result.finalScore = parseFloat(finalScore.toFixed(2));
  result.grade = finalScore >= 80 ? "A" : finalScore >= 70 ? "B" : finalScore >= 60 ? "C" : finalScore >= 50 ? "D" : "F";
  await result.save();
}

// ── COURSE PROGRESS (syllabus — not per-student, safe to show anyone) ────
await CourseProgress.create({
  course: course._id, lecturer: demo.faculty._id,
  topics: [
    { title: "Intro to distributed systems", description: "Why distributed?", status: "completed", dateCovered: daysFromNow(-21) },
    { title: "Replication & consistency",     description: "CAP theorem, quorum reads/writes", status: "completed", dateCovered: daysFromNow(-7) },
    { title: "Consensus (Raft/Paxos)",         description: "Leader election, log replication", status: "ongoing", dateCovered: daysFromNow(-2) },
    { title: "Distributed transactions",       description: "2PC, sagas", status: "planned" },
  ],
  assessments: [
    { type: "quiz", title: "Quiz 1 — CAP theorem", date: daysFromNow(-21), description: "Covers weeks 1-2" },
    { type: "test", title: "Midterm test", date: daysFromNow(-7), description: "Covers weeks 1-4" },
  ],
});

// ── LOGBOOK ───────────────────────────────────────────────────────────────
const assignmentDue = daysFromNow(5);
await Logbook.create({
  course: course._id, lecturer: demo.faculty._id, academicYear: "2025/2026", semester: "Semester 2",
  outline: [
    { week: 1, title: "Intro to distributed systems", status: "covered" },
    { week: 2, title: "Replication & consistency",     status: "covered" },
    { week: 3, title: "Consensus (Raft/Paxos)",         status: "partially_covered" },
    { week: 4, title: "Distributed transactions",       status: "pending" },
  ],
  sessions: [
    { date: daysFromNow(-21), topicCovered: "Intro to distributed systems", hoursDelivered: 2, remarks: "Good engagement" },
    { date: daysFromNow(-7),  topicCovered: "Replication & consistency",    hoursDelivered: 2 },
    { date: daysFromNow(-2),  topicCovered: "Raft leader election",         hoursDelivered: 1, remarks: "Continued next session" },
  ],
  assignments: [
    { title: "Assignment 1 — Raft demo", description: "Implement leader election", dueDate: daysFromNow(-1), totalMarks: 20,
      submissions: [{ student: demo.student._id, marksObtained: 18, remarks: "Solid implementation, minor edge case missed" }] },
    { title: "Assignment 2 — 2PC simulation", description: "Simulate a two-phase commit", dueDate: assignmentDue, totalMarks: 20, submissions: [] },
  ],
  assessments: [
    { title: "Quiz 1 — CAP theorem", type: "quiz", date: daysFromNow(-21), totalMarks: 10, scores: [{ student: demo.student._id, marksObtained: 8 }] },
    { title: "Midterm test", type: "mid-term", date: daysFromNow(-7), totalMarks: 40, scores: [{ student: demo.student._id, marksObtained: 34 }] },
  ],
  deadlines: [
    { title: "Assignment 2 due", type: "assignment", date: assignmentDue, description: "2PC simulation" },
    { title: "Final exam",       type: "exam",       date: daysFromNow(35) },
  ],
});

// ── NOTIFICATIONS (announcement to the course + a couple of general ones) ─
await Notification.create({
  recipient: demo.student._id, title: "Midterm postponed",
  message: "The CS-401 midterm originally scheduled for next Tuesday is moved to Friday 10:00 in Amphi A.",
  type: "announcement", referenceId: course._id,
});
await Notification.create({
  recipient: demo.student._id, title: "Book due soon",
  message: `"Distributed Systems: Principles" is due back in 9 days.`,
  type: "booking", read: true,
});

console.log(`Seeded ${books.length} books, ${equipment.length} equipment items, ${labs.length} labs/halls, ${bookingDefs.length} bookings, ${buses.length} buses, ${routes.length} routes, 3 bus reservations, 1 fuel log.`);
console.log(`Seeded 1 course (CS-401), 2 attendance sessions, 1 result, 1 course-progress record, 1 logbook, 2 notifications.`);
console.log("All booking/reservation/academic history is attached only to the 7 demo accounts — any newly registered account starts with zero history.");
process.exit();
