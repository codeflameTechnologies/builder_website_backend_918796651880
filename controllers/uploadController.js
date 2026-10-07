import cloudinary from "../config/cloudinary.js";

// Helper: upload a single buffer to Cloudinary via a stream
const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "builder-website/properties" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(buffer);
  });
};

// POST /api/upload  (admin only) — accepts multiple images, field name "images"
export const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadPromises = req.files.map((file) => streamUpload(file.buffer));
    const results = await Promise.all(uploadPromises);

    const urls = results.map((r) => r.secure_url);
    res.json({ urls });
  } catch (error) {
    res.status(500).json({ message: "Image upload failed", error: error.message });
  }
};
