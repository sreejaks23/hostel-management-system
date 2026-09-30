import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true },
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "Resident", required: true },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ["card", "bank_transfer", "cash", "stripe", "other"],
      default: "stripe",
    },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
    },
    transactionRef: { type: String },
    stripePaymentIntentId: { type: String },
    paidAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
