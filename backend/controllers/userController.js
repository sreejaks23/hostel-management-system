import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// @desc Admin: list all users
// @route GET /api/users
export const getUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(query)
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await User.countDocuments(query);

  res.json({ success: true, count: users.length, total, page: Number(page), users });
});

// @desc Admin: create a staff/admin user
// @route POST /api/users
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }
  const user = await User.create({ name, email, password, phone, role });
  res.status(201).json({ success: true, user: { ...user.toObject(), password: undefined } });
});

// @desc Admin: get single user
// @route GET /api/users/:id
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate("resident");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ success: true, user });
});

// @desc Admin: update user (role, active status, details)
// @route PUT /api/users/:id
export const updateUser = asyncHandler(async (req, res) => {
  const { name, phone, role, isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  await user.save();
  res.json({ success: true, user: { ...user.toObject(), password: undefined } });
});

// @desc Admin: delete user
// @route DELETE /api/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  await user.deleteOne();
  res.json({ success: true, message: "User removed" });
});
