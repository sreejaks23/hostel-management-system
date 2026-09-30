import { body } from "express-validator";

export const createResidentRules = [
  body("userId").isMongoId().withMessage("A valid linked user account is required"),
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("gender").optional().isIn(["male", "female", "other"]).withMessage("Invalid gender"),
];
