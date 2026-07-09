import * as userService from "./users.service.js";

export const createUser = async (req, res) => {
  try {
    // SECURITY: this is a *public* endpoint -- never trust a client-supplied
    // role here, or anyone could self-register as "admin". Every public
    // registration is a student; staff/admin roles are assigned afterwards
    // by an existing admin via PUT /api/users/:id (see updateUser below).
    const { name, email, password, matricule } = req.body;
    const user = await userService.registerUserService(name, email, password, matricule);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { matricule, password } = req.body;
    const user = await userService.loginUserService(matricule, password);
    res.status(200).json(user);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(400).json({ message: "No token provided" });
    await userService.logoutUserService(token);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await userService.changePasswordService(req.user._id, currentPassword, newPassword);
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  res.status(200).json(req.user);
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsersService();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserByIdService(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fields anyone is allowed to change on their own account. Anything else
// (role, matricule, email, isActive, etc.) must go through an admin via the
// "editing someone else" path below, gated by "users:manage".
const SELF_EDITABLE_FIELDS = ["name", "phone", "avatar", "classLevel", "specialty"];

export const updateUser = async (req, res) => {
  try {
    const isSelf = req.params.id === req.user._id.toString();

    if (isSelf) {
      // Never trust the client here — only pass through the safe subset of
      // fields, no matter what else is in the request body, so a user can't
      // grant themselves a new role/permissions by editing their own record.
      const patch = {};
      for (const key of SELF_EDITABLE_FIELDS) {
        if (key in req.body) patch[key] = req.body[key];
      }
      const user = await userService.updateUserService(req.params.id, patch);
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.status(200).json(user);
    }

    // Editing someone else's account — only reachable with "users:manage"
    // (admin-only), enforced by allowSelfOrPermission in users.routes.js.
    const user = await userService.updateUserService(req.params.id, req.body);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    // Prevent self-deletion — would log the caller out and potentially leave
    // no admin account in the system.
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }
    const user = await userService.deleteUserService(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/lookup/:matricule — checkout-desk borrower lookup. Returns
// only the minimal fields a staff member needs to identify and check
// eligibility for a borrower (never the password hash, obviously).
export const lookupUserByMatricule = async (req, res) => {
  try {
    const user = await userService.getUserByMatriculeService(req.params.matricule);
    if (!user) return res.status(404).json({ message: "No account found with that matricule" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
