import { usageAnalytics } from './usageAnalyticsService.ts';

export type ApiKey = 'gemini' | 'maps' | 'places';

export interface CostConfig {
  includeErrors: boolean;
  rates: Record<ApiKey, number>;
}

export interface CostSnapshot {
  config: CostConfig;
  sinceTs: number;
  totals: {
    gemini: { count: number; success: number; error: number };
    maps: { count: number; success: number; error: number };
    places: { count: number; success: number; error: number };
  };
  snapshot: {
    perApi: Record<ApiKey, { calls: number; costUSD: number; ratePerCallUSD: number }>;
    totalCostUSD: number;
  };
  window: {
    minutes: number;
    perApi: Record<ApiKey, { calls: number; ratePerMin: number; costUSD: number }>;
    projected: { dailyUSD: number; monthlyUSD: number };
  };
}

type Listener = (snap: CostSnapshot) => void;

class ApiCostService {
  private listeners: Listener[] = [];

  initSocket() {
    // Ensure main socket is connected
    usageAnalytics.connect();
    // Wire to cost update channel emitted by backend
    (usageAnalytics as any).socket?.on?.('api_cost_update', (payload: CostSnapshot) => {
      this.listeners.forEach((cb) => cb(payload));
    });
  }

  onUpdate(cb: Listener) {
    this.listeners.push(cb);
  }

  offUpdate(cb: Listener) {
    this.listeners = this.listeners.filter((l) => l !== cb);
  }

  async getSnapshot(windowMinutes = 60): Promise<CostSnapshot> {
    const res = await fetch(`/api/usage/cost?window=${windowMinutes}`);
    if (!res.ok) throw new Error(`Failed to fetch cost snapshot: ${res.status}`);
    return res.json();
  }

  async updateConfig(config: Partial<{ includeErrors: boolean; rates: Partial<Record<ApiKey, number>> }>): Promise<CostConfig> {
    const res = await fetch('/api/usage/cost/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error(`Failed to update cost config: ${res.status}`);
    const data = await res.json();
    return data.config as CostConfig;
  }
}

export const apiCostService = new ApiCostService();
