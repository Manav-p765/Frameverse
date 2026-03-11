/**
 * Cloudinary Configuration
 *
 * Configures the Cloudinary SDK for image/file uploads and deletions.
 * Uploads are automatically optimized (resized to 1080px, auto quality,
 * auto format) to minimize bandwidth and storage costs.
 */

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a file to Cloudinary with automatic optimization.
 * @param {string} file - File path or base64 data URI
 * @param {string} folder - Cloudinary folder (default: "posts")
 * @returns {{ url: string, public_id: string }}
 */
export const uploadToCloudinary = async (file, folder = "posts") => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: "auto",
      transformation: [
        { width: 1080, height: 1080, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    throw new Error("Image upload failed");
  }
};

/** Delete a file from Cloudinary by its public ID */
export const deleteFromCloudinary = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error("Image delete failed");
  }
};

export default cloudinary;
