import { v2 as cloudinary } from 'cloudinary';
import { getCloudinaryKeyManager, CloudinaryCredentials } from './CloudinaryKeyManager.js';

export class CloudinaryService {
  private keyManager = getCloudinaryKeyManager();

  /**
   * Upload an image to the next available account (Parallel Load Balancing)
   */
  async uploadImage(fileData: string, folder: string = 'ght_healthcare'): Promise<{ url: string, public_id: string, cloud_name: string } | null> {
    const creds = this.keyManager.getNextAccount();
    if (!creds) {
      console.error("No Cloudinary accounts available for upload.");
      return null;
    }

    // Configure Cloudinary on-the-fly for this specific account
    cloudinary.config({
      cloud_name: creds.cloudName,
      api_key: creds.apiKey,
      api_secret: creds.apiSecret,
      secure: true
    });

    try {
      const result = await cloudinary.uploader.upload(fileData, {
        folder,
        resource_type: 'auto'
      });

      return {
        url: result.secure_url,
        public_id: result.public_id,
        cloud_name: creds.cloudName
      };
    } catch (error) {
      console.error(`Upload failed for account ${creds.cloudName}:`, error);
      // We could retry with another account here if needed
      return null;
    }
  }

  /**
   * Delete an image using the "Master Keychain" logic (Identify account from URL)
   */
  async deleteImage(url: string): Promise<boolean> {
    const creds = this.keyManager.getCredentialsFromUrl(url);
    if (!creds) {
      console.error(`No credentials found for Cloudinary URL: ${url}`);
      return false;
    }

    // Configure Cloudinary on-the-fly for this specific account
    cloudinary.config({
      cloud_name: creds.cloudName,
      api_key: creds.apiKey,
      api_secret: creds.apiSecret,
      secure: true
    });

    try {
      // Extract public_id from URL
      // Cloudinary URLs look like: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[public_id].[ext]
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1];
      const publicIdWithExt = lastPart.split('.')[0];
      
      // If there's a folder, it's before the last part but after 'upload/v[version]/'
      // A more robust way is to find the index of 'upload/' and take everything after the version
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex === -1) return false;
      
      // Skip 'upload' and the version (which starts with 'v')
      let publicIdParts = parts.slice(uploadIndex + 2);
      // Remove extension from the last part
      publicIdParts[publicIdParts.length - 1] = publicIdParts[publicIdParts.length - 1].split('.')[0];
      const publicId = publicIdParts.join('/');

      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error(`Delete failed for account ${creds.cloudName}:`, error);
      return false;
    }
  }
}

let instance: CloudinaryService | null = null;
export function getCloudinaryService(): CloudinaryService {
  if (!instance) {
    instance = new CloudinaryService();
  }
  return instance;
}
