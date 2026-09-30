import asyncHandler from "express-async-handler";
import Room from "../models/Room.js";
import Resident from "../models/Resident.js";
import notify from "../utils/notify.js";
import User from "../models/User.js";

// @desc  List rooms with real-time occupancy/availability, filterable
// @route GET /api/rooms
export const getRooms = asyncHandler(async (req, res) => {
  const { status, type, block, search } = req.query;
  const query = {};
  if (status) query.status = status;
  if (type) query.type = type;
  if (block) query.block = block;
  if (search) query.roomNumber = { $regex: search, $options: "i" };

  const rooms = await Room.find(query).populate("occupants", "firstName lastName email phone status").sort("roomNumber");

  const summary = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === "available").length,
    occupied: rooms.filter((r) => r.status === "occupied").length,
    maintenance: rooms.filter((r) => r.status === "maintenance").length,
    reserved: rooms.filter((r) => r.status === "reserved").length,
  };

  res.json({ success: true, count: rooms.length, summary, rooms });
});

// @desc  Get single room
// @route GET /api/rooms/:id
export const getRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id).populate("occupants");
  if (!room) {
    res.status(404);
    throw new Error("Room not found");
  }
  res.json({ success: true, room });
});

// @desc  Create room
// @route POST /api/rooms
export const createRoom = asyncHandler(async (req, res) => {
  const room = await Room.create(req.body);
  res.status(201).json({ success: true, room });
});

// @desc  Update room details
// @route PUT /api/rooms/:id
export const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error("Room not found");
  }
  Object.assign(room, req.body);
  room.refreshStatus();
  await room.save();
  res.json({ success: true, room });
});

// @desc  Delete room (only if empty)
// @route DELETE /api/rooms/:id
export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error("Room not found");
  }
  if (room.occupants.length > 0) {
    res.status(400);
    throw new Error("Cannot delete a room that has occupants");
  }
  await room.deleteOne();
  res.json({ success: true, message: "Room removed" });
});

// @desc  Find available rooms for a resident, ranked by how well they match
//        the resident's stated room preferences (type & block)
// @route GET /api/rooms/match/:residentId
export const getMatchingRooms = asyncHandler(async (req, res) => {
  const resident = await Resident.findById(req.params.residentId);
  if (!resident) {
    res.status(404);
    throw new Error("Resident not found");
  }

  const rooms = await Room.find({ status: { $ne: "maintenance" } }).populate(
    "occupants",
    "firstName lastName"
  );

  const preferences = resident.roomPreferences || {};

  const matches = rooms
    .filter((room) => room.occupants.length < room.capacity)
    .map((room) => {
      let score = 0;
      if (preferences.type && room.type === preferences.type) score += 2;
      if (preferences.block && room.block === preferences.block) score += 1;
      return { room, score, isPreferredMatch: score > 0 };
    })
    .sort((a, b) => b.score - a.score || a.room.pricePerMonth - b.room.pricePerMonth);

  res.json({
    success: true,
    resident: {
      _id: resident._id,
      firstName: resident.firstName,
      lastName: resident.lastName,
      roomPreferences: preferences,
    },
    matches,
  });
});

// @desc  Assign / check-in a resident to a room
// @route POST /api/rooms/:id/assign
export const assignRoom = asyncHandler(async (req, res) => {
  const { residentId } = req.body;
  const room = await Room.findById(req.params.id);
  const resident = await Resident.findById(residentId).populate("user");

  if (!room) {
    res.status(404);
    throw new Error("Room not found");
  }
  if (!resident) {
    res.status(404);
    throw new Error("Resident not found");
  }
  if (room.occupants.length >= room.capacity) {
    res.status(400);
    throw new Error("Room is at full capacity");
  }
  if (resident.room) {
    res.status(400);
    throw new Error("Resident is already assigned to a room. Check out first to reassign.");
  }

  room.occupants.push(resident._id);
  room.refreshStatus();
  await room.save();

  resident.room = room._id;
  resident.status = "checked_in";
  resident.checkInDate = new Date();
  resident.roomHistory.push({ room: room._id, checkInDate: new Date() });
  await resident.save();

  if (resident.user) {
    await notify({
      user: resident.user,
      title: "Room Assigned",
      message: `You have been checked in to room ${room.roomNumber} (${room.block}).`,
      type: "room",
      channel: ["in_app", "email"],
    });
  }

  res.json({ success: true, room, resident });
});

// @desc  Check-out a resident from their room
// @route POST /api/rooms/:id/checkout
export const checkoutRoom = asyncHandler(async (req, res) => {
  const { residentId } = req.body;
  const room = await Room.findById(req.params.id);
  const resident = await Resident.findById(residentId).populate("user");

  if (!room || !resident) {
    res.status(404);
    throw new Error("Room or resident not found");
  }

  room.occupants = room.occupants.filter((o) => o.toString() !== residentId);
  room.refreshStatus();
  await room.save();

  resident.room = null;
  resident.status = "checked_out";
  resident.checkOutDate = new Date();
  const lastHistory = resident.roomHistory[resident.roomHistory.length - 1];
  if (lastHistory && !lastHistory.checkOutDate) {
    lastHistory.checkOutDate = new Date();
  }
  await resident.save();

  if (resident.user) {
    await notify({
      user: resident.user,
      title: "Checked Out",
      message: `You have been checked out of room ${room.roomNumber}.`,
      type: "room",
      channel: ["in_app", "email"],
    });
  }

  res.json({ success: true, room, resident });
});

// @desc  Change a resident's room (checkout old + assign new)
// @route POST /api/rooms/:id/change
export const changeRoom = asyncHandler(async (req, res) => {
  const { residentId, newRoomId } = req.body;
  const oldRoom = await Room.findById(req.params.id);
  const newRoom = await Room.findById(newRoomId);
  const resident = await Resident.findById(residentId).populate("user");

  if (!oldRoom || !newRoom || !resident) {
    res.status(404);
    throw new Error("Room(s) or resident not found");
  }
  if (newRoom.occupants.length >= newRoom.capacity) {
    res.status(400);
    throw new Error("Target room is at full capacity");
  }

  oldRoom.occupants = oldRoom.occupants.filter((o) => o.toString() !== residentId);
  oldRoom.refreshStatus();
  await oldRoom.save();

  newRoom.occupants.push(resident._id);
  newRoom.refreshStatus();
  await newRoom.save();

  resident.room = newRoom._id;
  const lastHistory = resident.roomHistory[resident.roomHistory.length - 1];
  if (lastHistory && !lastHistory.checkOutDate) lastHistory.checkOutDate = new Date();
  resident.roomHistory.push({ room: newRoom._id, checkInDate: new Date() });
  await resident.save();

  if (resident.user) {
    await notify({
      user: resident.user,
      title: "Room Changed",
      message: `You have been moved from room ${oldRoom.roomNumber} to room ${newRoom.roomNumber}.`,
      type: "room",
      channel: ["in_app", "email"],
    });
  }

  res.json({ success: true, oldRoom, newRoom, resident });
});
