import asyncHandler from "express-async-handler";

// @desc  Upload one or more images (e.g. for a maintenance request) and
//        return their public URLs for the client to attach to a record.
// @route POST /api/uploads
export const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("No files uploaded");
  }

  const urls = req.files.map((f) => `/uploads/${f.filename}`);
  res.status(201).json({ success: true, urls });
});
