import express from "express";
import {
  getDashboardStats,
  getRevenueReport,
  getOccupancyReport,
  getFinancialSummary,
  getMaintenanceReport,
} from "../controllers/reportController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, authorize("admin", "staff"));

router.get("/dashboard", getDashboardStats);
router.get("/revenue", getRevenueReport);
router.get("/occupancy", getOccupancyReport);
router.get("/financial-summary", getFinancialSummary);
router.get("/maintenance", getMaintenanceReport);

export default router;
