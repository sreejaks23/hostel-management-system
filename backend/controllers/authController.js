import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// @desc  Register a new user (residents self-register; admin/staff created by admin)
// @route POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  // Check if the user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists with this email");
  }

  // Only allow 'resident' role on public self-registration
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role === "resident" ? "resident" : "resident", // Default to 'resident'
  });

  // Generate token and send response
  const token = generateToken(res, user._id);

  res.status(201).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// @desc  Login
// @route POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email and include password for verification
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Check if the user is active
  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated. Contact an administrator.");
  }

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save();

  // Generate token and send response
  const token = generateToken(res, user._id);

  res.json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, resident: user.resident },
  });
});

// @desc  Logout
// @route POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", { httpOnly: true, expires: new Date(0) }); // Clear the token cookie
  res.json({ success: true, message: "Logged out" });
});

// @desc  Get current logged in user
// @route GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("resident");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ success: true, user });
});

// @desc  Update password
// @route PUT /api/auth/update-password
export const updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  const { currentPassword, newPassword } = req.body;

  // Verify current password
  if (!(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error("Current password is incorrect");
  }

  // Update password and save
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: "Password updated" });
});