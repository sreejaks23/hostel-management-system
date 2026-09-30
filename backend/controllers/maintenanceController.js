import asyncHandler from "express-async-handler";
import MaintenanceRequest from "../models/MaintenanceRequest.js";
import Resident from "../models/Resident.js";
import User from "../models/User.js";
import notify from "../utils/notify.js";

// ============================================================
// GET ALL MAINTENANCE REQUESTS
// GET /api/maintenance
// ============================================================
export const getMaintenanceRequests = asyncHandler(async (req, res) => {
  console.log("\n========== GET MAINTENANCE ==========");

  try {
    // ----------------------------------------------------------
    // Authentication check
    // ----------------------------------------------------------
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized");
    }

    console.log("USER ID:", req.user._id);
    console.log("USER ROLE:", req.user.role);
    console.log("QUERY:", req.query);

    // ----------------------------------------------------------
    // Query parameters
    // ----------------------------------------------------------
    const {
      status,
      priority,
      category,
      page = 1,
      limit = 20,
    } = req.query;

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);

    const pageLimit = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      100
    );

    const query = {};

    // ----------------------------------------------------------
    // Resident filtering
    // Residents can only see their own requests
    // ----------------------------------------------------------
    if (req.user.role === "resident") {
      console.log("Looking for resident profile...");

      const resident = await Resident.findOne({
        user: req.user._id,
      }).select("_id");

      console.log(
        "Resident profile:",
        resident ? resident._id : "NOT FOUND"
      );

      if (!resident) {
        return res.json({
          success: true,
          count: 0,
          total: 0,
          page: currentPage,
          pages: 0,
          requests: [],
        });
      }

      query.resident = resident._id;
    }

    // ----------------------------------------------------------
    // Filters
    // ----------------------------------------------------------
    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (category) {
      query.category = category;
    }

    console.log("MongoDB maintenance query:", query);

    // ----------------------------------------------------------
    // Count
    // ----------------------------------------------------------
    const total = await MaintenanceRequest.countDocuments(query);

    console.log("Total maintenance requests:", total);

    // ----------------------------------------------------------
    // Fetch requests
    // ----------------------------------------------------------
    const skip = (currentPage - 1) * pageLimit;

    console.log(
      `Fetching requests: skip=${skip}, limit=${pageLimit}`
    );

    const requests = await MaintenanceRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .populate({
        path: "resident",
        select: "firstName lastName phone",
      })
      .populate({
        path: "room",
        select: "roomNumber block",
      })
      .populate({
        path: "assignedTo",
        select: "name email",
      })
      .lean();

    console.log("Requests returned:", requests.length);

    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------
    const pages =
      total > 0 ? Math.ceil(total / pageLimit) : 0;

    console.log("Pages:", pages);
    console.log("========== GET MAINTENANCE SUCCESS ==========\n");

    return res.json({
      success: true,
      count: requests.length,
      total,
      page: currentPage,
      pages,
      requests,
    });
  } catch (error) {
    console.error("\n==========================================");
    console.error("GET MAINTENANCE FAILED");
    console.error("==========================================");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("==========================================\n");

    res.status(500);
    throw new Error(
      `Failed to load maintenance requests: ${error.message}`
    );
  }
});

// ============================================================
// GET ONE MAINTENANCE REQUEST
// GET /api/maintenance/:id
// ============================================================
export const getMaintenanceRequest = asyncHandler(async (req, res) => {
  const request = await MaintenanceRequest.findById(req.params.id)
    .populate("resident")
    .populate("room")
    .populate("assignedTo", "name email")
    .populate("comments.author", "name role");

  if (!request) {
    res.status(404);
    throw new Error("Maintenance request not found");
  }

  // Residents can only view their own request
  if (req.user.role === "resident") {
    const resident = await Resident.findOne({
      user: req.user._id,
    });

    if (
      !resident ||
      !request.resident ||
      request.resident._id.toString() !== resident._id.toString()
    ) {
      res.status(403);
      throw new Error(
        "Not authorized to view this request"
      );
    }
  }

  res.json({
    success: true,
    request,
  });
});

// ============================================================
// CREATE MAINTENANCE REQUEST
// POST /api/maintenance
// ============================================================
export const createMaintenanceRequest = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized");
    }

    const resident = await Resident.findOne({
      user: req.user._id,
    });

    if (!resident) {
      res.status(404);
      throw new Error("Resident profile not found");
    }

    if (!resident.room) {
      res.status(400);
      throw new Error(
        "You must be checked in to a room to submit a maintenance request"
      );
    }

    const {
      category,
      title,
      description,
      priority,
      images,
    } = req.body;

    // ----------------------------------------------------------
    // Validation
    // ----------------------------------------------------------
    if (!category) {
      res.status(400);
      throw new Error(
        "Maintenance category is required"
      );
    }

    if (!title || !title.trim()) {
      res.status(400);
      throw new Error(
        "Maintenance request title is required"
      );
    }

    if (!description || !description.trim()) {
      res.status(400);
      throw new Error(
        "Maintenance request description is required"
      );
    }

    // ----------------------------------------------------------
    // Create
    // ----------------------------------------------------------
    const request = await MaintenanceRequest.create({
      resident: resident._id,
      room: resident.room,
      category,
      title: title.trim(),
      description: description.trim(),
      priority: priority || "medium",
      images: Array.isArray(images) ? images : [],
    });

    // ----------------------------------------------------------
    // Notify staff/admin
    // ----------------------------------------------------------
    try {
      const staff = await User.find({
        role: {
          $in: ["staff", "admin"],
        },
        isActive: true,
      });

      await Promise.all(
        staff.map((user) =>
          notify({
            user,
            title: "New Maintenance Request",
            message: `${resident.firstName || ""} ${
              resident.lastName || ""
            } submitted: ${request.title} (${request.priority})`,
            type: "maintenance",
            channel: ["in_app"],
          })
        )
      );
    } catch (notificationError) {
      // Notification failure should NOT make the maintenance
      // request itself fail.
      console.error(
        "Maintenance notification failed:",
        notificationError.message
      );
    }

    // ----------------------------------------------------------
    // Populate response
    // ----------------------------------------------------------
    await request.populate([
      {
        path: "resident",
        select: "firstName lastName phone",
      },
      {
        path: "room",
        select: "roomNumber block",
      },
    ]);

    res.status(201).json({
      success: true,
      request,
    });
  }
);

// ============================================================
// UPDATE MAINTENANCE REQUEST
// PUT /api/maintenance/:id
// ============================================================
export const updateMaintenanceRequest = asyncHandler(
  async (req, res) => {
    const request = await MaintenanceRequest.findById(
      req.params.id
    ).populate({
      path: "resident",
      populate: {
        path: "user",
      },
    });

    if (!request) {
      res.status(404);
      throw new Error(
        "Maintenance request not found"
      );
    }

    const {
      status,
      priority,
      assignedTo,
      category,
    } = req.body;

    if (status) {
      request.status = status;

      if (status === "resolved") {
        request.resolvedAt = new Date();
      } else {
        request.resolvedAt = undefined;
      }
    }

    if (priority) {
      request.priority = priority;
    }

    if (assignedTo !== undefined) {
      request.assignedTo = assignedTo || null;
    }

    if (category) {
      request.category = category;
    }

    await request.save();

    // ----------------------------------------------------------
    // Notify resident
    // ----------------------------------------------------------
    if (request.resident?.user && status) {
      try {
        await notify({
          user: request.resident.user,
          title: "Maintenance Request Update",
          message: `Your request "${request.title}" is now: ${status.replace(
            "_",
            " "
          )}.`,
          type: "maintenance",
          channel: ["in_app", "email"],
        });
      } catch (notificationError) {
        console.error(
          "Maintenance update notification failed:",
          notificationError.message
        );
      }
    }

    await request.populate([
      {
        path: "resident",
        select: "firstName lastName phone",
      },
      {
        path: "room",
        select: "roomNumber block",
      },
      {
        path: "assignedTo",
        select: "name email",
      },
    ]);

    res.json({
      success: true,
      request,
    });
  }
);

// ============================================================
// ADD COMMENT
// POST /api/maintenance/:id/comments
// ============================================================
export const addComment = asyncHandler(async (req, res) => {
  const request = await MaintenanceRequest.findById(
    req.params.id
  ).populate({
    path: "resident",
    populate: {
      path: "user",
    },
  });

  if (!request) {
    res.status(404);
    throw new Error(
      "Maintenance request not found"
    );
  }

  if (
    !req.body.message ||
    !req.body.message.trim()
  ) {
    res.status(400);
    throw new Error(
      "Comment message is required"
    );
  }

  // Residents can only comment on their own request
  if (req.user.role === "resident") {
    const resident = await Resident.findOne({
      user: req.user._id,
    });

    if (
      !resident ||
      !request.resident ||
      request.resident._id.toString() !==
        resident._id.toString()
    ) {
      res.status(403);
      throw new Error(
        "Not authorized to comment on this request"
      );
    }
  }

  request.comments.push({
    author: req.user._id,
    message: req.body.message.trim(),
  });

  await request.save();

  // Notify resident
  if (
    req.user.role !== "resident" &&
    request.resident?.user
  ) {
    try {
      await notify({
        user: request.resident.user,
        title: "New Update on Your Request",
        message: `${req.user.name} commented on "${request.title}": ${req.body.message}`,
        type: "maintenance",
        channel: ["in_app"],
      });
    } catch (notificationError) {
      console.error(
        "Comment notification failed:",
        notificationError.message
      );
    }
  }

  await request.populate([
    {
      path: "resident",
      select: "firstName lastName phone",
    },
    {
      path: "room",
      select: "roomNumber block",
    },
    {
      path: "assignedTo",
      select: "name email",
    },
    {
      path: "comments.author",
      select: "name role",
    },
  ]);

  res.json({
    success: true,
    request,
  });
});

// ============================================================
// DELETE MAINTENANCE REQUEST
// DELETE /api/maintenance/:id
// ============================================================
export const deleteMaintenanceRequest = asyncHandler(
  async (req, res) => {
    const request =
      await MaintenanceRequest.findById(
        req.params.id
      );

    if (!request) {
      res.status(404);
      throw new Error(
        "Maintenance request not found"
      );
    }

    await request.deleteOne();

    res.json({
      success: true,
      message: "Maintenance request removed",
    });
  }
);