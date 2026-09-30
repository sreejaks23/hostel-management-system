import { body } from "express-validator";

export const createInvoiceRules = [
  body("residentId").isMongoId().withMessage("A valid residentId is required"),
  body("billingPeriod.from").isISO8601().withMessage("A valid billing period start date is required"),
  body("billingPeriod.to").isISO8601().withMessage("A valid billing period end date is required"),
  body("dueDate").isISO8601().withMessage("A valid due date is required"),
  body("items").isArray({ min: 1 }).withMessage("At least one invoice item is required"),
  body("items.*.description").trim().notEmpty().withMessage("Each item needs a description"),
  body("items.*.amount").isFloat({ min: 0 }).withMessage("Each item amount must be non-negative"),
];

export const recordPaymentRules = [
  body("amount").isFloat({ gt: 0 }).withMessage("Payment amount must be greater than 0"),
];

export const paymentPlanRules = [
  body("numberOfInstallments")
    .isInt({ min: 2, max: 12 })
    .withMessage("Number of installments must be between 2 and 12"),
];
