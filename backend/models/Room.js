import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    block: {
      type: String,
      required: true,
      trim: true,
    },

    floor: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "single",
        "double",
        "triple",
        "dormitory",
      ],
      required: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    occupants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resident",
      },
    ],

    pricePerMonth: {
      type: Number,
      required: true,
      min: 0,
    },

    amenities: [
      {
        type: String,
      },
    ],

    status: {
      type: String,
      enum: [
        "available",
        "occupied",
        "maintenance",
        "reserved",
      ],
      default: "available",
    },

    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// OCCUPANCY VIRTUAL
// ============================================================
roomSchema.virtual("occupancy").get(function () {
  const occupants = Array.isArray(
    this.occupants
  )
    ? this.occupants.length
    : 0;

  return `${occupants}/${this.capacity}`;
});

// ============================================================
// JSON / OBJECT VIRTUALS
// ============================================================
roomSchema.set("toJSON", {
  virtuals: true,
});

roomSchema.set("toObject", {
  virtuals: true,
});

// ============================================================
// REFRESH ROOM STATUS
// ============================================================
roomSchema.methods.refreshStatus =
  function () {
    if (this.status === "maintenance") {
      return;
    }

    const occupants = Array.isArray(
      this.occupants
    )
      ? this.occupants.length
      : 0;

    this.status =
      occupants >= this.capacity
        ? "occupied"
        : "available";
  };

export default mongoose.model(
  "Room",
  roomSchema
);