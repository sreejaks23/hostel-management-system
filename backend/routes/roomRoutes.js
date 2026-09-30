import express from "express";
import {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  assignRoom,
  checkoutRoom,
  changeRoom,
} from "../controllers/roomController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { createRoomRules, assignRoomRules } from "../validators/roomValidators.js";

const router = express.Router();

router.get("/", protect, getRooms);
router.get("/:id", protect, getRoom);
router.post("/", protect, authorize("admin", "staff"), createRoomRules, validate, createRoom);
router.put("/:id", protect, authorize("admin", "staff"), updateRoom);
router.delete("/:id", protect, authorize("admin"), deleteRoom);
router.post("/:id/assign", protect, authorize("admin", "staff"), assignRoomRules, validate, assignRoom);
router.post("/:id/checkout", protect, authorize("admin", "staff"), assignRoomRules, validate, checkoutRoom);
router.post("/:id/change", protect, authorize("admin", "staff"), changeRoom);

export default router;
