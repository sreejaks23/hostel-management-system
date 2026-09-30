import express from "express";
import {
  getMaintenanceRequests,
  getMaintenanceRequest,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  addComment,
  deleteMaintenanceRequest,
} from "../controllers/maintenanceController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { createMaintenanceRules } from "../validators/maintenanceValidators.js";

const router = express.Router();

router.get("/", protect, getMaintenanceRequests);
router.post("/", protect, authorize("resident"), createMaintenanceRules, validate, createMaintenanceRequest);
router.get("/:id", protect, getMaintenanceRequest);
router.put("/:id", protect, authorize("admin", "staff"), updateMaintenanceRequest);
router.post("/:id/comments", protect, addComment);
router.delete("/:id", protect, authorize("admin"), deleteMaintenanceRequest);

export default router;
