import asyncHandler from "express-async-handler";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import Resident from "../models/Resident.js";
import { createPaymentIntent, retrievePaymentIntent } from "../utils/paymentGateway.js";
import notify from "../utils/notify.js";

const generateInvoiceNumber = async () => {
  const count = await Invoice.countDocuments();
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
};

// @desc  List invoices (admin/staff all; resident own)
// @route GET /api/billing/invoices
export const getInvoices = asyncHandler(async (req, res) => {
  const { status, residentId, page = 1, limit = 20 } = req.query;
  const query = {};

  if (req.user.role === "resident") {
    const resident = await Resident.findOne({ user: req.user._id });
    if (!resident) return res.json({ success: true, count: 0, invoices: [] });
    query.resident = resident._id;
  } else if (residentId) {
    query.resident = residentId;
  }
  if (status) query.status = status;

  const invoices = await Invoice.find(query)
    .populate("resident", "firstName lastName email")
    .populate("room", "roomNumber block")
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Invoice.countDocuments(query);
  res.json({ success: true, count: invoices.length, total, invoices });
});

// @desc  Get single invoice with payment history
// @route GET /api/billing/invoices/:id
export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate("resident")
    .populate("room");
  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }
  const payments = await Payment.find({ invoice: invoice._id }).sort("-createdAt");
  res.json({ success: true, invoice, payments });
});

// @desc  Create an invoice (room fee, utilities, services, discounts, late fees)
// @route POST /api/billing/invoices
export const createInvoice = asyncHandler(async (req, res) => {
  const { residentId, roomId, billingPeriod, items, discount = 0, lateFee = 0, tax = 0, dueDate, notes } = req.body;

  const resident = await Resident.findById(residentId).populate("user");
  if (!resident) {
    res.status(404);
    throw new Error("Resident not found");
  }

  const invoice = new Invoice({
    invoiceNumber: await generateInvoiceNumber(),
    resident: residentId,
    room: roomId || resident.room,
    billingPeriod,
    items,
    discount,
    lateFee,
    tax,
    dueDate,
    notes,
  });
  invoice.recalculate();
  await invoice.save();

  if (resident.user) {
    await notify({
      user: resident.user,
      title: "New Invoice Issued",
      message: `Invoice ${invoice.invoiceNumber} for ${invoice.total.toFixed(2)} is due on ${new Date(dueDate).toDateString()}.`,
      type: "billing",
      channel: ["in_app", "email"],
    });
  }

  res.status(201).json({ success: true, invoice });
});

// @desc  Update invoice (edit items, apply discount/late fee, cancel)
// @route PUT /api/billing/invoices/:id
export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }
  const { items, discount, lateFee, tax, dueDate, notes, status } = req.body;
  if (items !== undefined) invoice.items = items;
  if (discount !== undefined) invoice.discount = discount;
  if (lateFee !== undefined) invoice.lateFee = lateFee;
  if (tax !== undefined) invoice.tax = tax;
  if (dueDate !== undefined) invoice.dueDate = dueDate;
  if (notes !== undefined) invoice.notes = notes;
  if (status !== undefined) invoice.status = status;

  invoice.recalculate();
  if (invoice.amountPaid >= invoice.total && invoice.total > 0) invoice.status = "paid";
  else if (invoice.amountPaid > 0) invoice.status = "partially_paid";

  await invoice.save();
  res.json({ success: true, invoice });
});

// @desc  Apply a late fee / discount adjustment as a payment-plan tool
// @route POST /api/billing/invoices/:id/adjust
export const adjustInvoice = asyncHandler(async (req, res) => {
  const { type, amount, reason } = req.body; // type: 'discount' | 'late_fee'
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }
  invoice.items.push({
    description: reason || (type === "discount" ? "Discount applied" : "Late fee applied"),
    category: type === "discount" ? "discount" : "late_fee",
    amount: type === "discount" ? -Math.abs(amount) : Math.abs(amount),
  });
  invoice.recalculate();
  await invoice.save();
  res.json({ success: true, invoice });
});

// @desc  Record a manual payment (cash/bank transfer) against an invoice
// @route POST /api/billing/invoices/:id/pay
export const recordPayment = asyncHandler(async (req, res) => {
  const { amount, method = "cash", notes } = req.body;
  const invoice = await Invoice.findById(req.params.id).populate({ path: "resident", populate: "user" });
  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  const payment = await Payment.create({
    invoice: invoice._id,
    resident: invoice.resident._id,
    amount,
    method,
    status: "succeeded",
    paidAt: new Date(),
    notes,
  });

  invoice.amountPaid += amount;
  invoice.status = invoice.amountPaid >= invoice.total ? "paid" : "partially_paid";
  await invoice.save();

  if (invoice.resident.user) {
    await notify({
      user: invoice.resident.user,
      title: "Payment Received",
      message: `We received a payment of ${amount.toFixed(2)} for invoice ${invoice.invoiceNumber}.`,
      type: "billing",
      channel: ["in_app", "email"],
    });
  }

  res.status(201).json({ success: true, invoice, payment });
});

// @desc  Create a payment plan: splits the outstanding balance into scheduled installments
// @route POST /api/billing/invoices/:id/payment-plan
export const createPaymentPlan = asyncHandler(async (req, res) => {
  const { numberOfInstallments, startDate, intervalDays = 30 } = req.body;
  const invoice = await Invoice.findById(req.params.id).populate({ path: "resident", populate: "user" });
  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  const balance = Math.round((invoice.total - invoice.amountPaid) * 100) / 100;
  if (balance <= 0) {
    res.status(400);
    throw new Error("This invoice has no outstanding balance to schedule");
  }

  const n = Math.max(2, Math.min(12, Number(numberOfInstallments) || 2));
  const base = Math.floor((balance / n) * 100) / 100;

  const installments = [];
  let allocated = 0;
  for (let i = 0; i < n; i++) {
    const amount = i === n - 1 ? Math.round((balance - allocated) * 100) / 100 : base;
    allocated += amount;
    const due = new Date(startDate || Date.now());
    due.setDate(due.getDate() + Number(intervalDays) * i);
    installments.push({ description: `Installment ${i + 1} of ${n}`, amount, dueDate: due });
  }

  invoice.installments = installments;
  await invoice.save();

  if (invoice.resident.user) {
    await notify({
      user: invoice.resident.user,
      title: "Payment Plan Created",
      message: `Invoice ${invoice.invoiceNumber} has been split into ${n} installments starting ${installments[0].dueDate.toDateString()}.`,
      type: "billing",
      channel: ["in_app", "email"],
    });
  }

  res.status(201).json({ success: true, invoice });
});

// @desc  Pay a single installment of an invoice's payment plan
// @route POST /api/billing/invoices/:id/installments/:installmentId/pay
export const payInstallment = asyncHandler(async (req, res) => {
  const { method = "cash" } = req.body;
  const invoice = await Invoice.findById(req.params.id).populate({ path: "resident", populate: "user" });
  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  const installment = invoice.installments.id(req.params.installmentId);
  if (!installment) {
    res.status(404);
    throw new Error("Installment not found");
  }
  if (installment.status === "paid") {
    res.status(400);
    throw new Error("This installment has already been paid");
  }

  installment.status = "paid";
  installment.paidAt = new Date();

  const payment = await Payment.create({
    invoice: invoice._id,
    resident: invoice.resident._id,
    amount: installment.amount,
    method,
    status: "succeeded",
    paidAt: new Date(),
    notes: installment.description,
  });

  invoice.amountPaid = Math.round((invoice.amountPaid + installment.amount) * 100) / 100;
  invoice.status = invoice.amountPaid >= invoice.total ? "paid" : "partially_paid";
  await invoice.save();

  if (invoice.resident.user) {
    await notify({
      user: invoice.resident.user,
      title: "Installment Payment Received",
      message: `We received your installment payment of ${installment.amount.toFixed(2)} for invoice ${invoice.invoiceNumber}.`,
      type: "billing",
      channel: ["in_app", "email"],
    });
  }

  res.status(201).json({ success: true, invoice, payment });
});

// @desc  Create a Stripe PaymentIntent for an invoice (online card payment)
// @route POST /api/billing/invoices/:id/create-payment-intent
export const createInvoicePaymentIntent = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }
  const balanceDue = invoice.total - invoice.amountPaid;
  if (balanceDue <= 0) {
    res.status(400);
    throw new Error("This invoice has no outstanding balance");
  }

  const intent = await createPaymentIntent({
    amount: balanceDue,
    metadata: { invoiceId: invoice._id.toString(), invoiceNumber: invoice.invoiceNumber },
  });

  await Payment.create({
    invoice: invoice._id,
    resident: invoice.resident,
    amount: balanceDue,
    method: "stripe",
    status: "pending",
    stripePaymentIntentId: intent.id,
  });

  res.json({ success: true, clientSecret: intent.client_secret });
});

// @desc  Confirm a Stripe payment succeeded (called after redirect, or via webhook route)
// @route POST /api/billing/payments/confirm
export const confirmStripePayment = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;
  const intent = await retrievePaymentIntent(paymentIntentId);

  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
  if (!payment) {
    res.status(404);
    throw new Error("Payment record not found");
  }

  if (intent.status === "succeeded" && payment.status !== "succeeded") {
    payment.status = "succeeded";
    payment.paidAt = new Date();
    await payment.save();

    const invoice = await Invoice.findById(payment.invoice).populate({ path: "resident", populate: "user" });
    invoice.amountPaid += payment.amount;
    invoice.status = invoice.amountPaid >= invoice.total ? "paid" : "partially_paid";
    await invoice.save();

    if (invoice.resident.user) {
      await notify({
        user: invoice.resident.user,
        title: "Payment Successful",
        message: `Your online payment of ${payment.amount.toFixed(2)} for invoice ${invoice.invoiceNumber} was successful.`,
        type: "billing",
        channel: ["in_app", "email"],
      });
    }
  }

  res.json({ success: true, status: intent.status, payment });
});

// @desc  Get payment history (admin/staff all, resident own)
// @route GET /api/billing/payments
export const getPayments = asyncHandler(async (req, res) => {
  const query = {};
  if (req.user.role === "resident") {
    const resident = await Resident.findOne({ user: req.user._id });
    if (!resident) return res.json({ success: true, payments: [] });
    query.resident = resident._id;
  }
  const payments = await Payment.find(query)
    .populate("invoice", "invoiceNumber total")
    .populate("resident", "firstName lastName")
    .sort("-createdAt");
  res.json({ success: true, count: payments.length, payments });
});
