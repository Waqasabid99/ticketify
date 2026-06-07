import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { Readable } from "stream";
import { ApiError } from "../utils/error.js";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Compresses an image buffer using sharp without losing quality (visually lossless).
 * @param {Buffer} fileBuffer - Original file buffer
 * @returns {Promise<Buffer>} - Compressed file buffer
 */
export const compressImage = async (fileBuffer) => {
    try {
        const metadata = await sharp(fileBuffer).metadata();
        const format = metadata.format;

        let pipeline = sharp(fileBuffer);

        if (format === "jpeg" || format === "jpg") {
            pipeline = pipeline.jpeg({ quality: 85, progressive: true });
        } else if (format === "png") {
            pipeline = pipeline.png({ compressionLevel: 9, palette: true });
        } else if (format === "webp") {
            pipeline = pipeline.webp({ quality: 85 });
        } else {
            // Convert other formats to WebP at 85% quality by default
            pipeline = pipeline.webp({ quality: 85 });
        }

        return await pipeline.toBuffer();
    } catch (error) {
        throw new ApiError(`Image compression failed: ${error.message}`, 500);
    }
};

/**
 * Uploads an image buffer to Cloudinary after compressing it.
 * @param {Buffer} fileBuffer - The image file buffer
 * @param {string} folder - Destination folder inside Cloudinary
 * @returns {Promise<object>} - Cloudinary upload result
 */
export const uploadImage = async (fileBuffer, folder = "general") => {
    try {
        if (!fileBuffer) {
            throw ApiError.badRequest("No file buffer provided");
        }

        // Compress image first
        const compressedBuffer = await compressImage(fileBuffer);

        // Upload to Cloudinary using streams
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `ticketify/${folder}`,
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) {
                        return reject(ApiError.badRequest(`Cloudinary upload failed: ${error.message}`));
                    }
                    resolve(result);
                }
            );

            Readable.from(compressedBuffer).pipe(uploadStream);
        });
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(`Image upload failed: ${error.message}`, 500);
    }
};

/**
 * Extracts the public ID of an image from its Cloudinary URL.
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null
 */
export const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    const pathAndFilename = parts[1].replace(/^v\d+\//, ""); // Remove version like v12345678/
    const lastDotIndex = pathAndFilename.lastIndexOf(".");
    if (lastDotIndex === -1) return pathAndFilename;
    return pathAndFilename.substring(0, lastDotIndex);
};

/**
 * Deletes an image from Cloudinary using its URL.
 * @param {string} url - Cloudinary secure URL
 * @returns {Promise<object|null>} - Cloudinary delete result or null
 */
export const deleteImage = async (url) => {
    try {
        const publicId = getPublicIdFromUrl(url);
        if (!publicId) return null;
        return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error(`Failed to delete image from Cloudinary: ${error.message}`);
        return null;
    }
};
