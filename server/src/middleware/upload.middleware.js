import multer from "multer";
import { ApiError } from "../utils/error.js";

// Use memory storage to access file buffers directly
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(ApiError.badRequest("Only image files are allowed!"), false);
    }
};

// Export the configured multer instance
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
