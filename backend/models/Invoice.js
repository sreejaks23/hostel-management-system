import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["room_fee", "utility", "service", "late_fee", "discount", "other"],
      default: "other",
    },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const installmentSchema = new mongoose.Schema(
  {
    description: { type: String, default: "Installment" },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["pending", "paid", "overdue"], default: "pending" },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "Resident", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    billingPeriod: {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
    },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    lateFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "issued", "partially_paid", "paid", "overdue", "cancelled"],
      default: "issued",
    },
    dueDate: { type: Date, required: true },
    notes: { type: String },
    // Optional payment plan: splits the outstanding balance into scheduled installments
    installments: [installmentSchema],
  },
  { timestamps: true }
);

invoiceSchema.methods.recalculate = function () {
  const itemsTotal = this.items.reduce((sum, i) => sum + i.amount, 0);
  this.subtotal = itemsTotal;
  this.total = Math.max(itemsTotal - this.discount + this.lateFee + this.tax, 0);
};

export default mongoose.model("Invoice", invoiceSchema);
