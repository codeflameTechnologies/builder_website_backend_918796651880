import express from "express";
import { uploadImages } from "../controllers/uploadController.js";
import upload from "../middleware/upload.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// field name must be "images" on the frontend, max 6 files
router.post("/", protect, upload.array("images", 6), uploadImages);

export default router;
