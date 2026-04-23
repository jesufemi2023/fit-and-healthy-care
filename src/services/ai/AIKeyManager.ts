import { getSupabaseAdmin } from "../supabaseAdmin.js";

export class AIKeyManager {
  private keys: string[];
  private currentIndex: number = 0;
  private exhaustedKeys: Map<string, number> = new Map();
  private lastSync: number = 0;

  constructor() {
    // Support multiple keys separated by commas for rotation
    const sources = [
      process.env.GEMINI_API_KEYS,
      process.env.GEMINI_API_KEY,
      process.env.API_KEY
    ];
    
    const allKeys = sources
      .filter(Boolean)
      .join(',')
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0 && k !== "MY_GEMINI_API_KEY");
    
    // De-duplicate keys
    this.keys = [...new Set(allKeys)];
    
    if (this.keys.length === 0) {
      console.warn("No Gemini API keys found. AI features will be disabled.");
    } else {
      console.log(`AI Key Manager initialized with ${this.keys.length} unique key(s).`);
    }
  }

  private async syncFromDatabase() {
    // Only sync every 5 minutes to avoid DB overhead
    if (Date.now() - this.lastSync < 5 * 60 * 1000) return;
    
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('api_keys_status')
        .select('*')
        .eq('service', 'gemini');
      
      if (error) {
        // Table might not exist yet, which is fine
        return;
      }

      if (data) {
        const now = Date.now();
        data.forEach((row: any) => {
          const resetAt = new Date(row.reset_at).getTime();
          if (resetAt > now) {
            this.exhaustedKeys.set(row.api_key, resetAt);
          } else {
            this.exhaustedKeys.delete(row.api_key);
          }
        });
        this.lastSync = now;
      }
    } catch (e) {
      // Silently fail if table doesn't exist
    }
  }

  async markKeyAsExhausted(key: string, type: 'quota' | 'rate' = 'quota') {
    // Quota resets at midnight UTC (approx 24h), Rate limit resets in 1 minute
    const duration = type === 'quota' ? 24 * 60 * 60 * 1000 : 60 * 1000;
    const resetAt = Date.now() + duration;
    
    this.exhaustedKeys.set(key, resetAt);
    console.warn(`AI Key ${key.substring(0, 8)}... marked as ${type} exhausted. Reset at: ${new Date(resetAt).toISOString()}`);

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase.from('api_keys_status').upsert({
          api_key: key,
          service: 'gemini',
          status: type,
          reset_at: new Date(resetAt).toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'api_key' });
      } catch (e) {
        // Silently fail
      }
    }
  }

  async getNextKey(): Promise<string | null> {
    if (this.keys.length === 0) return null;

    // Periodically sync from DB to get status from other instances
    await this.syncFromDatabase();

    const now = Date.now();
    
    // Clean up expired local exhaustion
    for (const [key, resetAt] of this.exhaustedKeys.entries()) {
      if (now >= resetAt) {
        this.exhaustedKeys.delete(key);
        console.log(`AI Key ${key.substring(0, 8)}... has been recycled (reset time passed).`);
      }
    }

    // Try to find a non-exhausted key starting from currentIndex
    for (let i = 0; i < this.keys.length; i++) {
      const index = (this.currentIndex + i) % this.keys.length;
      const key = this.keys[index];
      
      if (!this.exhaustedKeys.has(key)) {
        // Update index for next call (Round-robin among healthy keys)
        this.currentIndex = (index + 1) % this.keys.length;
        return key;
      }
    }

    // If ALL keys are exhausted, we have a problem. 
    // We'll return the one that resets soonest as a last resort, 
    // or null if they are all far away.
    console.error("ALL Gemini API keys are currently exhausted.");
    
    // Last resort: find the one with the earliest reset time
    let soonestKey: string | null = null;
    let soonestTime = Infinity;
    
    for (const [key, resetAt] of this.exhaustedKeys.entries()) {
      if (resetAt < soonestTime) {
        soonestTime = resetAt;
        soonestKey = key;
      }
    }

    // If the soonest reset is more than 1 hour away for a quota, return null
    // But if it's a rate limit (short), we can return it and let the retry logic handle it
    if (soonestKey && (soonestTime - now) < 60 * 60 * 1000) {
      return soonestKey;
    }

    return null;
  }

  getKeyCount(): number {
    return this.keys.length;
  }

  hasKeys(): boolean {
    return this.keys.length > 0;
  }
}
