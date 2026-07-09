import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../modules/users/users.model.js";
import { ROLES } from "../shared/constants/roles.js";

// Mirrors client/src/lib/role-context.tsx DEFAULT_USERS exactly, so the
// frontend's login screen hint ("any seeded email + password demo") and the
// dev-only role switcher both work against this real backend. Idempotent —
// safe to re-run; existing accounts are left untouched.
const DEMO_USERS = [
  { name: "Amira N. Kone",    matricule: "IUC-2024-STU-0421", email: "amira.kone@iuc.edu", role: ROLES.STUDENT },
  { name: "Dr. Samuel Etoa",  matricule: "IUC-FAC-0098",      email: "s.etoa@iuc.edu",      role: ROLES.FACULTY },
  { name: "Marie Owono",      matricule: "IUC-LIB-0012",      email: "m.owono@iuc.edu",     role: ROLES.LIBRARY_MANAGER },
  { name: "Paul Diallo",      matricule: "IUC-LOG-0044",      email: "p.diallo@iuc.edu",    role: ROLES.LOGISTICS_MANAGER },
  { name: "Eric Nkomo",       matricule: "IUC-ITE-0031",      email: "e.nkomo@iuc.edu",     role: ROLES.IT_MANAGER },
  { name: "Dr. Sarah Mballa", matricule: "IUC-LAB-0019",      email: "s.mballa@iuc.edu",    role: ROLES.LAB_MANAGER },
  { name: "Joelle Mbarga",    matricule: "IUC-ADM-0007",      email: "j.mbarga@iuc.edu",    role: ROLES.ADMIN },
];

const DEMO_PASSWORD = "demo";

await mongoose.connect(process.env.MONGO_URI);

const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, salt);

let created = 0;
let skipped = 0;

for (const u of DEMO_USERS) {
  const exists = await User.findOne({ email: u.email });
  if (exists) {
    skipped++;
    continue;
  }
  await User.create({ ...u, password: hashedPassword });
  created++;
}

console.log(`Demo users seeded: ${created} created, ${skipped} already existed.`);
console.log(`Login with any of the matricules above (e.g. "${DEMO_USERS[0].matricule}") and password "${DEMO_PASSWORD}".`);
process.exit();
