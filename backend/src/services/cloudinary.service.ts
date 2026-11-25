import { createHash } from "node:crypto";

import { env } from "../config/env";

export const uploadsConfigured = () =>
  !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

/** Lets the browser upload straight to Cloudinary for the next few minutes, into one folder. */
export function signUpload(folder = "pric/products") {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`)
    .digest("hex");

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    signature,
  };
}