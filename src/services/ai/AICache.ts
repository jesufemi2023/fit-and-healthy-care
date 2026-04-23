interface CacheEntry {
  response: string;
  timestamp: number;
}

export class AICache {
  private cache = new Map<string, CacheEntry>();
  private ttl: number;

  constructor() {
    // Default TTL: 24 hours (configurable via env)
    const ttlHours = parseInt(process.env.AI_CACHE_TTL_HOURS || "24", 10);
    this.ttl = ttlHours * 60 * 60 * 1000;
  }

  get(prompt: string): string | null {
    const normalized = this.normalize(prompt);
    const entry = this.cache.get(normalized);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(normalized);
      return null;
    }
    
    return entry.response;
  }

  set(prompt: string, response: string): void {
    const normalized = this.normalize(prompt);
    this.cache.set(normalized, { response, timestamp: Date.now() });
  }

  private normalize(prompt: string): string {
    return prompt.toLowerCase().trim().replace(/\s+/g, ' ');
  }
}
