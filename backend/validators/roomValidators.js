import { body } from "express-validator";

export const createRoomRules = [
  body("roomNumber").trim().notEmpty().withMessage("Room number is required"),
  body("block").trim().notEmpty().withMessage("Block is required"),
  body("floor").isInt({ min: 0 }).withMessage("Floor must be a non-negative number"),
  body("type").isIn(["single", "double", "triple", "dormitory"]).withMessage("Invalid room type"),
  body("capacity").isInt({ min: 1 }).withMessage("Capacity must be at least 1"),
  body("pricePerMonth").isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
];

export const assignRoomRules = [
  body("residentId").isMongoId().withMessage("A valid residentId is required"),
];
