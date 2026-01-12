// Cost tracking for Google Places API
class CostTracker {
  constructor() {
    this.dailyCalls = 0;
    this.dailyCost = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.lastReset = new Date();
    
    // Google Places API costs
    this.costs = {
      nearby: 0.032,      // Nearby Search
      textsearch: 0.032,  // Text Search
      details: 0.017,     // Place Details
      photos: 0.007       // Place Photos
    };
  }
  
  resetIfNewDay() {
    const now = new Date();
    if (now.getDate() !== this.lastReset.getDate()) {
      console.log(`📊 Daily Summary: ${this.dailyCalls} calls, $${this.dailyCost.toFixed(2)}, ${this.getCacheHitRate()}% cache hit`);
      this.dailyCalls = 0;
      this.dailyCost = 0;
      this.cacheHits = 0;
      this.cacheMisses = 0;
      this.lastReset = now;
    }
  }
  
  trackAPICall(type = 'nearby') {
    this.resetIfNewDay();
    this.dailyCalls++;
    this.cacheMisses++;
    this.dailyCost += this.costs[type] || 0.032;
    
    console.log(`💰 API Call: ${type} | Today: ${this.dailyCalls} calls = $${this.dailyCost.toFixed(2)}`);
    
    // Alert if approaching daily budget ($200/month = ~$6.50/day)
    if (this.dailyCost > 6.50) {
      console.warn(`⚠️ WARNING: Daily cost $${this.dailyCost.toFixed(2)} exceeds budget!`);
    }
  }
  
  trackCacheHit() {
    this.resetIfNewDay();
    this.cacheHits++;
    const saved = this.costs.nearby;
    console.log(`✅ Cache HIT | Saved $${saved.toFixed(3)} | Hit rate: ${this.getCacheHitRate()}%`);
  }
  
  getCacheHitRate() {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? Math.round((this.cacheHits / total) * 100) : 0;
  }
  
  getStats() {
    this.resetIfNewDay();
    return {
      dailyCalls: this.dailyCalls,
      dailyCost: parseFloat(this.dailyCost.toFixed(2)),
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRate: this.getCacheHitRate(),
      monthlyCostProjection: parseFloat((this.dailyCost * 30).toFixed(2)),
      underFreeCredit: (this.dailyCost * 30) < 200
    };
  }
}

module.exports = new CostTracker();
