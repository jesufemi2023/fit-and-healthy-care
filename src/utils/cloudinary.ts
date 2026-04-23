/**
 * Utility for Cloudinary image transformations to optimize performance and bandwidth.
 */

export const getOptimizedImageUrl = (url: string, width: number = 800): string => {
  if (!url) return "";

  // If it's already a Cloudinary URL, inject transformations
  if (url.includes("cloudinary.com")) {
    // Cloudinary URLs usually look like: https://res.cloudinary.com/cloud_name/image/upload/v12345/path/to/image.jpg
    // We want to insert transformations after /upload/
    const parts = url.split("/upload/");
    if (parts.length === 2) {
      return `${parts[0]}/upload/f_auto,q_auto,w_${width}/${parts[1]}`;
    }
  }

  // If it's a Picsum URL, we can also optimize it by requesting specific dimensions
  if (url.includes("picsum.photos")) {
    // Picsum URLs look like: https://picsum.photos/seed/xxx/width/height
    // We can replace the width/height at the end
    const parts = url.split("/");
    if (parts.length >= 6) {
      // Replace width and height
      parts[parts.length - 2] = width.toString();
      parts[parts.length - 1] = Math.round(width * 0.75).toString(); // Maintain 4:3 or similar
      return parts.join("/");
    }
  }

  // Fallback for other URLs (no optimization possible without a proxy)
  return url;
};
