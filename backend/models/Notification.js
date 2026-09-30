import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["maintenance", "billing", "room", "general", "alert"],
      default: "general",
    },
    channel: {
      type: [String],
      enum: ["in_app", "email", "sms"],
      default: ["in_app"],
    },
    isRead: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
