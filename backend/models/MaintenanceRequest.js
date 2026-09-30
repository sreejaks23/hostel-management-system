import mongoose from "mongoose";

const maintenanceRequestSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "Resident", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    category: {
      type: String,
      enum: ["electrical", "plumbing", "furniture", "cleaning", "internet", "appliance", "other"],
      default: "other",
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "assigned", "in_progress", "resolved", "closed", "cancelled"],
      default: "open",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    images: [{ type: String }],
    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("MaintenanceRequest", maintenanceRequestSchema);
