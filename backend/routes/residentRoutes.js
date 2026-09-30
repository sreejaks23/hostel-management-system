import express from "express";
import {
  getResidents,
  getResident,
  createResident,
  updateResident,
  deleteResident,
  getMyResidentProfile,
  getSuggestedRooms,
} from "../controllers/residentController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { createResidentRules } from "../validators/residentValidators.js";

const router = express.Router();

router.get("/me/profile", protect, getMyResidentProfile);

router.get("/", protect, authorize("admin", "staff"), getResidents);
router.post("/", protect, authorize("admin", "staff"), createResidentRules, validate, createResident);
router.get("/:id", protect, authorize("admin", "staff"), getResident);
router.put("/:id", protect, authorize("admin", "staff"), updateResident);
router.delete("/:id", protect, authorize("admin"), deleteResident);
router.get("/:id/suggested-rooms", protect, authorize("admin", "staff"), getSuggestedRooms);

export default router;
