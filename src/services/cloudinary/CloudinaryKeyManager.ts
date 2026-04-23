export interface CloudinaryCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export class CloudinaryKeyManager {
  private accounts: Map<string, CloudinaryCredentials> = new Map();
  private accountList: CloudinaryCredentials[] = [];
  private currentIndex: number = 0;

  constructor() {
    const config = process.env.CLOUDINARY_ACCOUNTS;
    if (config) {
      // Format: cloud1:key1:secret1,cloud2:key2:secret2
      const accountStrings = config.split(',').map(s => s.trim()).filter(Boolean);
      accountStrings.forEach(s => {
        const [cloudName, apiKey, apiSecret] = s.split(':');
        if (cloudName && apiKey && apiSecret) {
          const creds = { cloudName, apiKey, apiSecret };
          this.accounts.set(cloudName, creds);
          this.accountList.push(creds);
        }
      });
    }

    // Also support single CLOUDINARY_URL if present
    const singleUrl = process.env.CLOUDINARY_URL;
    if (singleUrl && singleUrl.startsWith('cloudinary://')) {
      try {
        const url = new URL(singleUrl);
        const cloudName = url.host;
        const apiKey = url.username;
        const apiSecret = url.password;
        if (cloudName && apiKey && apiSecret && !this.accounts.has(cloudName)) {
          const creds = { cloudName, apiKey, apiSecret };
          this.accounts.set(cloudName, creds);
          this.accountList.push(creds);
        }
      } catch (e) {
        console.error("Failed to parse CLOUDINARY_URL:", e);
      }
    }

    if (this.accountList.length === 0) {
      console.warn("No Cloudinary accounts configured.");
    } else {
      console.log(`Cloudinary Key Manager initialized with ${this.accountList.length} account(s).`);
    }
  }

  /**
   * Get credentials for a specific cloud name (The "Master Keychain" logic)
   */
  getCredentialsForCloud(cloudName: string): CloudinaryCredentials | null {
    return this.accounts.get(cloudName) || null;
  }

  /**
   * Get credentials from a full Cloudinary URL
   */
  getCredentialsFromUrl(url: string): CloudinaryCredentials | null {
    // Cloudinary URLs look like: https://res.cloudinary.com/[cloud_name]/image/upload/...
    const match = url.match(/res\.cloudinary\.com\/([^/]+)\//);
    if (match && match[1]) {
      return this.getCredentialsForCloud(match[1]);
    }
    return null;
  }

  /**
   * Get the next available account for parallel uploads (Load Balancing)
   */
  getNextAccount(): CloudinaryCredentials | null {
    if (this.accountList.length === 0) return null;
    const creds = this.accountList[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.accountList.length;
    return creds;
  }

  hasAccounts(): boolean {
    return this.accountList.length > 0;
  }
}

let instance: CloudinaryKeyManager | null = null;
export function getCloudinaryKeyManager(): CloudinaryKeyManager {
  if (!instance) {
    instance = new CloudinaryKeyManager();
  }
  return instance;
}
