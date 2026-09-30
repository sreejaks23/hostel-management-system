import mongoose from "mongoose";

const residentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    address: { type: String },
    idProofType: { type: String, enum: ["passport", "national_id", "driving_license", "other"] },
    idProofNumber: { type: String },
    occupation: { type: String },
    emergencyContact: {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String },
    },
    roomPreferences: {
      type: { type: String, enum: ["single", "double", "triple", "dormitory"] },
      block: { type: String },
    },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
    status: {
      type: String,
      enum: ["pending", "checked_in", "checked_out", "inactive"],
      default: "pending",
    },
    checkInDate: { type: Date },
    checkOutDate: { type: Date },
    roomHistory: [
      {
        room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
        checkInDate: Date,
        checkOutDate: Date,
      },
    ],
    notes: { type: String },
  },
  { timestamps: true }
);

residentSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});
residentSchema.set("toJSON", { virtuals: true });
residentSchema.set("toObject", { virtuals: true });

export default mongoose.model("Resident", residentSchema);
