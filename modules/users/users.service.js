import User from "./users.model.js";
import TokenBlacklist from "./token-blacklist.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import generateToken from "../../shared/utils/generateToken.js";
import { ROLES } from "../../shared/constants/roles.js";

// REGISTER (public — always creates a student account, see users.controller.js)
// Matricule is compulsory: it's the login identifier (see loginUserService
// below), so an account without one couldn't sign back in.
export const registerUserService = async (name, email, password, matricule) => {
  const trimmedMatricule = matricule?.trim();
  if (!trimmedMatricule) throw new Error("Matricule is required");

  const emailTaken = await User.findOne({ email });
  if (emailTaken) throw new Error("User already exists");

  const matriculeTaken = await User.findOne({ matricule: trimmedMatricule });
  if (matriculeTaken) throw new Error("An account with that matricule already exists");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: ROLES.STUDENT,
    matricule: trimmedMatricule,
  });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    matricule: user.matricule,
    token: generateToken(user),
  };
};

// LOGIN — by matricule (the ID students/staff actually carry), not email.
export const loginUserService = async (matricule, password) => {
  const user = await User.findOne({ matricule: matricule?.trim() });

  if (user && (await bcrypt.compare(password, user.password))) {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      matricule: user.matricule,
      token: generateToken(user),
    };
  }

  throw new Error("Invalid matricule or password");
};

// LOGOUT — blacklist the token
export const logoutUserService = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const expiresAt = new Date(decoded.exp * 1000);
  await TokenBlacklist.create({ token, expiresAt });
};

// CHANGE PASSWORD
export const changePasswordService = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new Error("Current password is incorrect");

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();
};

// GET ALL USERS (admin)
export const getAllUsersService = async () => {
  return await User.find().select("-password").sort({ createdAt: -1 });
};

// GET USER BY ID
export const getUserByIdService = async (userId) => {
  return await User.findById(userId).select("-password");
};

// GET USER BY MATRICULE (checkout-desk lookup)
export const getUserByMatriculeService = async (matricule) => {
  return await User.findOne({ matricule }).select("-password");
};

// UPDATE USER (admin) — this is how role changes happen (e.g. promoting a
// student to library_manager). Password updates are blocked here on purpose;
// use PATCH /change-password instead.
export const updateUserService = async (userId, updates) => {
  delete updates.password;
  return await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select("-password");
};

// DELETE USER (admin)
export const deleteUserService = async (userId) => {
  return await User.findByIdAndDelete(userId);
};
