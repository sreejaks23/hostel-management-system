import asyncHandler from "express-async-handler";
import Resident from "../models/Resident.js";
import User from "../models/User.js";
import Room from "../models/Room.js";

// @desc  List residents (admin/staff) with search & filters
// @route GET /api/residents
export const getResidents = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const residents = await Resident.find(query)
    .populate("room", "roomNumber block type")
    .populate("user", "email role isActive")
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Resident.countDocuments(query);

  res.json({ success: true, count: residents.length, total, page: Number(page), residents });
});

// @desc  Get one resident profile
// @route GET /api/residents/:id
export const getResident = asyncHandler(async (req, res) => {
  const resident = await Resident.findById(req.params.id)
    .populate("room")
    .populate("user", "email role isActive")
    .populate("roomHistory.room", "roomNumber block");
  if (!resident) {
    res.status(404);
    throw new Error("Resident not found");
  }
  res.json({ success: true, resident });
});

// @desc  Create resident profile (admin/staff, e.g. onboarding a resident)
// @route POST /api/residents
export const createResident = asyncHandler(async (req, res) => {
  const { userId, ...residentData } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("Linked user account not found");
  }

  const existing = await Resident.findOne({ user: userId });
  if (existing) {
    res.status(400);
    throw new Error("A resident profile already exists for this user");
  }

  const resident = await Resident.create({ user: userId, ...residentData });
  user.resident = resident._id;
  await user.save();

  res.status(201).json({ success: true, resident });
});

// @desc  Update resident profile
// @route PUT /api/residents/:id
export const updateResident = asyncHandler(async (req, res) => {
  const resident = await Resident.findById(req.params.id);
  if (!resident) {
    res.status(404);
    throw new Error("Resident not found");
  }
  // Prevent direct mutation of room/roomHistory here; handled by room controller
  const { room, roomHistory, ...safeUpdates } = req.body;
  Object.assign(resident, safeUpdates);
  await resident.save();
  res.json({ success: true, resident });
});

// @desc  Delete resident profile
// @route DELETE /api/residents/:id
export const deleteResident = asyncHandler(async (req, res) => {
  const resident = await Resident.findById(req.params.id);
  if (!resident) {
    res.status(404);
    throw new Error("Resident not found");
  }
  if (resident.room) {
    res.status(400);
    throw new Error("Cannot delete a resident currently assigned to a room. Check out first.");
  }
  await resident.deleteOne();
  res.json({ success: true, message: "Resident removed" });
});

// @desc  Get logged-in resident's own profile
// @route GET /api/residents/me/profile
export const getMyResidentProfile = asyncHandler(async (req, res) => {
  const resident = await Resident.findOne({ user: req.user._id }).populate("room");
  if (!resident) {
    res.status(404);
    throw new Error("No resident profile found for this account");
  }
  res.json({ success: true, resident });
});

// @desc  Suggest rooms for a resident, ranked by how well they match the
//        resident's stated preferences (type + block), then by availability.
//        This powers "assignment based on preferences and availability".
// @route GET /api/residents/:id/suggested-rooms
export const getSuggestedRooms = asyncHandler(async (req, res) => {
  const resident = await Resident.findById(req.params.id);
  if (!resident) {
    res.status(404);
    throw new Error("Resident not found");
  }

  const rooms = await Room.find({ status: { $ne: "maintenance" } }).sort("roomNumber");
  const preferredType = resident.roomPreferences?.type;
  const preferredBlock = resident.roomPreferences?.block;

  const scored = rooms
    .map((room) => {
      const hasSpace = room.occupants.length < room.capacity;
      let matchScore = 0;
      const matchReasons = [];

      if (preferredType && room.type === preferredType) {
        matchScore += 2;
        matchReasons.push("Preferred room type");
      }
      if (preferredBlock && room.block?.toLowerCase() === preferredBlock?.toLowerCase()) {
        matchScore += 1;
        matchReasons.push("Preferred block");
      }

      return {
        _id: room._id,
        roomNumber: room.roomNumber,
        block: room.block,
        floor: room.floor,
        type: room.type,
        capacity: room.capacity,
        occupantsCount: room.occupants.length,
        pricePerMonth: room.pricePerMonth,
        amenities: room.amenities,
        status: room.status,
        hasSpace,
        matchScore,
        matchReasons,
      };
    })
    // Only rooms with free space are useful for assignment
    .filter((r) => r.hasSpace)
    // Best matches first; ties broken by lower occupancy (more private) then room number
    .sort((a, b) => b.matchScore - a.matchScore || a.occupantsCount - b.occupantsCount || a.roomNumber.localeCompare(b.roomNumber));

  res.json({
    success: true,
    preferences: resident.roomPreferences || {},
    count: scored.length,
    rooms: scored,
  });
});
