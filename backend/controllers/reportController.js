import asyncHandler from "express-async-handler";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import Room from "../models/Room.js";
import Resident from "../models/Resident.js";
import MaintenanceRequest from "../models/MaintenanceRequest.js";

// @desc  Dashboard summary stats
// @route GET /api/reports/dashboard
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalRooms, occupiedRooms, totalResidents, activeResidents, openMaintenance, invoices] =
    await Promise.all([
      Room.countDocuments(),
      Room.countDocuments({ status: "occupied" }),
      Resident.countDocuments(),
      Resident.countDocuments({ status: "checked_in" }),
      MaintenanceRequest.countDocuments({ status: { $in: ["open", "assigned", "in_progress"] } }),
      Invoice.find(),
    ]);

  const totalRevenue = invoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const outstandingBalance = invoices.reduce((sum, i) => sum + (i.total - i.amountPaid), 0);
  const occupancyRate = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  res.json({
    success: true,
    stats: {
      totalRooms,
      occupiedRooms,
      occupancyRate,
      totalResidents,
      activeResidents,
      openMaintenance,
      totalRevenue,
      outstandingBalance,
    },
  });
});

// @desc  Revenue report over time, grouped by month
// @route GET /api/reports/revenue?from=&to=
export const getRevenueReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = {};
  if (from || to) {
    match.paidAt = {};
    if (from) match.paidAt.$gte = new Date(from);
    if (to) match.paidAt.$lte = new Date(to);
  }
  match.status = "succeeded";

  const revenueByMonth = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const revenueByMethod = await Payment.aggregate([
    { $match: match },
    { $group: { _id: "$method", total: { $sum: "$amount" } } },
  ]);

  res.json({ success: true, revenueByMonth, revenueByMethod });
});

// @desc  Occupancy report - by room type and block
// @route GET /api/reports/occupancy
export const getOccupancyReport = asyncHandler(async (req, res) => {
  const byType = await Room.aggregate([
    {
      $group: {
        _id: "$type",
        totalRooms: { $sum: 1 },
        occupiedRooms: { $sum: { $cond: [{ $eq: ["$status", "occupied"] }, 1, 0] } },
        totalCapacity: { $sum: "$capacity" },
        totalOccupants: { $sum: { $size: "$occupants" } },
      },
    },
  ]);

  const byBlock = await Room.aggregate([
    {
      $group: {
        _id: "$block",
        totalRooms: { $sum: 1 },
        occupiedRooms: { $sum: { $cond: [{ $eq: ["$status", "occupied"] }, 1, 0] } },
      },
    },
  ]);

  res.json({ success: true, byType, byBlock });
});

// @desc  Expenses / outstanding report - overdue invoices, discounts, late fees given
// @route GET /api/reports/financial-summary
export const getFinancialSummary = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find();
  const totalBilled = invoices.reduce((sum, i) => sum + i.total, 0);
  const totalCollected = invoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const totalOutstanding = totalBilled - totalCollected;
  const totalDiscounts = invoices.reduce((sum, i) => sum + (i.discount || 0), 0);
  const totalLateFees = invoices.reduce((sum, i) => sum + (i.lateFee || 0), 0);
  const overdueInvoices = invoices.filter(
    (i) => i.status !== "paid" && i.status !== "cancelled" && new Date(i.dueDate) < new Date()
  );

  res.json({
    success: true,
    summary: {
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalDiscounts,
      totalLateFees,
      overdueCount: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce((sum, i) => sum + (i.total - i.amountPaid), 0),
    },
  });
});

// @desc  Maintenance report - requests by status/category/priority
// @route GET /api/reports/maintenance
export const getMaintenanceReport = asyncHandler(async (req, res) => {
  const byStatus = await MaintenanceRequest.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const byCategory = await MaintenanceRequest.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
  const byPriority = await MaintenanceRequest.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]);

  const resolved = await MaintenanceRequest.find({ resolvedAt: { $ne: null } });
  const avgResolutionHours =
    resolved.length > 0
      ? resolved.reduce((sum, r) => sum + (r.resolvedAt - r.createdAt) / 36e5, 0) / resolved.length
      : 0;

  res.json({ success: true, byStatus, byCategory, byPriority, avgResolutionHours: Math.round(avgResolutionHours * 10) / 10 });
});
