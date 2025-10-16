interface UsageMetrics {
  totalRequests: number;
  estimatedCost: number;
  cacheHitRate: number;
  topEndpoints: Array<{ endpoint: string; count: number; cost: number }>;
  dailyUsage: Array<{ date: string; requests: number; cost: number }>;
}

class CostMonitoringService {
  private static readonly COST_PER_REQUEST = {
    'gemini-2.5-flash': 0.002, // $0.002 per request (estimated)
    'places': 0.001,
    'emergency': 0.0005
  };

  private usage: Map<string, number> = new Map();
  private cacheHits = 0;
  private totalRequests = 0;

  trackRequest(endpoint: string, fromCache: boolean = false): void {
    this.totalRequests++;
    
    if (fromCache) {
      this.cacheHits++;
      console.log(`💰 Cost saved: $${this.COST_PER_REQUEST[endpoint as keyof typeof this.COST_PER_REQUEST] || 0.001}`);
    } else {
      const current = this.usage.get(endpoint) || 0;
      this.usage.set(endpoint, current + 1);
    }
  }

  getUsageMetrics(): UsageMetrics {
    const totalCost = Array.from(this.usage.entries()).reduce((sum, [endpoint, count]) => {
      const costPerRequest = this.COST_PER_REQUEST[endpoint as keyof typeof this.COST_PER_REQUEST] || 0.001;
      return sum + (count * costPerRequest);
    }, 0);

    const cacheHitRate = this.totalRequests > 0 ? (this.cacheHits / this.totalRequests) * 100 : 0;

    return {
      totalRequests: this.totalRequests,
      estimatedCost: totalCost,
      cacheHitRate,
      topEndpoints: Array.from(this.usage.entries()).map(([endpoint, count]) => ({
        endpoint,
        count,
        cost: count * (this.COST_PER_REQUEST[endpoint as keyof typeof this.COST_PER_REQUEST] || 0.001)
      })).sort((a, b) => b.cost - a.cost),
      dailyUsage: this.getDailyUsage()
    };
  }

  private getDailyUsage(): Array<{ date: string; requests: number; cost: number }> {
    // Simplified daily usage tracking
    const today = new Date().toISOString().split('T')[0];
    return [{
      date: today,
      requests: this.totalRequests,
      cost: this.getUsageMetrics().estimatedCost
    }];
  }

  shouldThrottle(): boolean {
    const metrics = this.getUsageMetrics();
    return metrics.estimatedCost > 10; // Throttle if daily cost exceeds $10
  }

  reset(): void {
    this.usage.clear();
    this.cacheHits = 0;
    this.totalRequests = 0;
  }
}

export const costMonitoring = new CostMonitoringService();