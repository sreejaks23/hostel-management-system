import express from "express";
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  adjustInvoice,
  recordPayment,
  createPaymentPlan,
  payInstallment,
  createInvoicePaymentIntent,
  confirmStripePayment,
  getPayments,
} from "../controllers/billingController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { createInvoiceRules, recordPaymentRules, paymentPlanRules } from "../validators/billingValidators.js";

const router = express.Router();

router.get("/invoices", protect, getInvoices);
router.post("/invoices", protect, authorize("admin", "staff"), createInvoiceRules, validate, createInvoice);
router.get("/invoices/:id", protect, getInvoice);
router.put("/invoices/:id", protect, authorize("admin", "staff"), updateInvoice);
router.post("/invoices/:id/adjust", protect, authorize("admin", "staff"), adjustInvoice);
router.post("/invoices/:id/pay", protect, authorize("admin", "staff"), recordPaymentRules, validate, recordPayment);
router.post("/invoices/:id/payment-plan", protect, authorize("admin", "staff"), paymentPlanRules, validate, createPaymentPlan);
router.post("/invoices/:id/installments/:installmentId/pay", protect, authorize("admin", "staff"), payInstallment);
router.post("/invoices/:id/create-payment-intent", protect, createInvoicePaymentIntent);
router.post("/payments/confirm", protect, confirmStripePayment);
router.get("/payments", protect, getPayments);

export default router;
