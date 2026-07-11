/**
 * One-off script to create a specific user in the database.
 * Usage: node scripts/createUser.js
 *
 * Safe to re-run — skips creation if the matricule already exists.
 */
import dotenv from "dotenv";
dotenv.config({ override: true });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../modules/users/users.model.js";
import { ROLES } from "../shared/constants/roles.js";

const USER = {
  name: "IUC Student 002",
  matricule: "IUC26-002",
  email: "iuc26-002@iuc.edu",
  role: ROLES.STUDENT,
  password: "123456",
};

await mongoose.connect(process.env.MONGO_URI);

const exists = await User.findOne({ matricule: USER.matricule });
if (exists) {
  console.log(`User "${USER.matricule}" already exists — skipping.`);
} else {
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(USER.password, salt);
  await User.create({ ...USER, password: hashed });
  console.log(`✅ Created user "${USER.matricule}" (role: ${USER.role}).`);
  console.log(`   Login: matricule=${USER.matricule}  password=${USER.password}`);
}

process.exit();
