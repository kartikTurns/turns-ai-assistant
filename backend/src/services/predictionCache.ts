// Prediction Cache Service - Cache predictions and reasoning chains
// Predictions are expensive (extended thinking + multiple tool calls), so we cache them

interface PredictionCacheEntry {
  query: string;
  prediction: any;
  reasoning: string;
  confidence: string;
  timestamp: number;
  historicalData: any[];
  expiresAt: number;
}

class PredictionCacheService {
  private cache: Map<string, PredictionCacheEntry> = new Map();
  private cacheTimeout: number;

  constructor(timeoutMs: number = 3600000) { // Default 1 hour
    this.cacheTimeout = timeoutMs;
  }

  // Generate cache key from query (normalize for consistency)
  private generateCacheKey(query: string, dateContext?: string): string {
    const normalized = query.toLowerCase().trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');

    return dateContext
      ? `${normalized}_${dateContext}`
      : normalized;
  }

  // Check if cache entry is still valid
  private isValid(entry: PredictionCacheEntry): boolean {
    return Date.now() < entry.expiresAt;
  }

  // Store prediction in cache
  cachePrediction(
    query: string,
    prediction: any,
    reasoning: string,
    confidence: string,
    historicalData: any[],
    dateContext?: string
  ): void {
    const key = this.generateCacheKey(query, dateContext);

    const entry: PredictionCacheEntry = {
      query,
      prediction,
      reasoning,
      confidence,
      timestamp: Date.now(),
      historicalData,
      expiresAt: Date.now() + this.cacheTimeout
    };

    this.cache.set(key, entry);

    console.log(`📦 Cached prediction for: "${query}" (expires in ${this.cacheTimeout / 1000}s)`);

    // Clean expired entries
    this.cleanExpired();
  }

  // Retrieve cached prediction
  getCachedPrediction(query: string, dateContext?: string): PredictionCacheEntry | null {
    const key = this.generateCacheKey(query, dateContext);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (!this.isValid(entry)) {
      this.cache.delete(key);
      console.log(`⏰ Cache expired for: "${query}"`);
      return null;
    }

    console.log(`✅ Cache hit for: "${query}" (age: ${Math.round((Date.now() - entry.timestamp) / 1000)}s)`);
    return entry;
  }

  // Check if prediction exists in cache
  hasCachedPrediction(query: string, dateContext?: string): boolean {
    const entry = this.getCachedPrediction(query, dateContext);
    return entry !== null;
  }

  // Clean expired cache entries
  private cleanExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired prediction cache entries`);
    }
  }

  // Clear all cache
  clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Cleared ${size} prediction cache entries`);
  }

  // Get cache statistics
  getStats(): {
    size: number;
    validEntries: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const now = Date.now();
    let validCount = 0;
    let oldest: number | null = null;
    let newest: number | null = null;

    for (const entry of this.cache.values()) {
      if (this.isValid(entry)) {
        validCount++;

        if (oldest === null || entry.timestamp < oldest) {
          oldest = entry.timestamp;
        }
        if (newest === null || entry.timestamp > newest) {
          newest = entry.timestamp;
        }
      }
    }

    return {
      size: this.cache.size,
      validEntries: validCount,
      oldestEntry: oldest,
      newestEntry: newest
    };
  }

  // Get all cached predictions (for debugging)
  getAllCached(): Array<{query: string, age: number, confidence: string}> {
    const results: Array<{query: string, age: number, confidence: string}> = [];
    const now = Date.now();

    for (const entry of this.cache.values()) {
      if (this.isValid(entry)) {
        results.push({
          query: entry.query,
          age: Math.round((now - entry.timestamp) / 1000),
          confidence: entry.confidence
        });
      }
    }

    return results;
  }
}

// Export singleton instance
export const predictionCache = new PredictionCacheService(
  3600000 // 1 hour default TTL
);

export type { PredictionCacheEntry };
