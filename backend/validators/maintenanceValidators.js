import { body } from "express-validator";

export const createMaintenanceRules = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 150 }),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("category")
    .optional()
    .isIn(["electrical", "plumbing", "furniture", "cleaning", "internet", "appliance", "other"])
    .withMessage("Invalid category"),
  body("priority").optional().isIn(["low", "medium", "high", "urgent"]).withMessage("Invalid priority"),
];
