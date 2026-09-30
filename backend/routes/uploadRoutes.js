import express from "express";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import { uploadImages } from "../controllers/uploadController.js";

const router = express.Router();

// Max 5 images per request
router.post("/", protect, upload.array("images", 5), uploadImages);

export default router;
