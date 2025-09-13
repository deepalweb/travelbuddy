import { io, Socket } from 'socket.io-client';

export type ApiKind = 'gemini' | 'maps' | 'places';

export interface UsageTotals {
  gemini: { count: number; success: number; error: number };
  maps: { count: number; success: number; error: number };
  places: { count: number; success: number; error: number };
}

export interface UsageEvent {
  id: string;
  ts: number;
  api: ApiKind;
  action?: string;
  status: 'success' | 'error';
  durationMs?: number;
  meta?: any;
}

class UsageAnalyticsService {
  private socket: Socket | null = null;
  private listeners: Array<(payload: { totals: UsageTotals; events: UsageEvent[]; lastEvent?: UsageEvent }) => void> = [];

  connect() {
    if (this.socket) return;
    const apiBase: string | undefined = (import.meta as any).env?.VITE_API_BASE_URL || (window as any).API_BASE;
    const explicitWs: string | undefined = (import.meta as any).env?.VITE_WEBSOCKET_URL || (window as any).WEBSOCKET_URL;
    const endpoint = (explicitWs
      || (apiBase ? apiBase.replace(/^http/, 'ws') : null)
      || location.origin.replace(/^http/, 'ws')) as string;
    this.socket = io(endpoint, { transports: ['websocket'] });
    this.socket.on('api_usage_update', (payload) => {
      this.listeners.forEach((cb) => cb(payload));
    });
  }

  onUpdate(cb: (payload: { totals: UsageTotals; events: UsageEvent[]; lastEvent?: UsageEvent }) => void) {
    this.listeners.push(cb);
  }

  offUpdate(cb: (payload: { totals: UsageTotals; events: UsageEvent[]; lastEvent?: UsageEvent }) => void) {
    this.listeners = this.listeners.filter((l) => l !== cb);
  }

  async postUsage(event: { api: ApiKind; action?: string; status: 'success' | 'error'; durationMs?: number; meta?: any }) {
    try {
      await fetch(`/api/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (e) {
      // Best effort; swallow errors
      console.warn('Failed to post usage event', e);
    }
  }

  async getSnapshot(): Promise<{ totals: UsageTotals; events: UsageEvent[] }> {
    const res = await fetch('/api/usage');
    if (!res.ok) throw new Error(`Failed to fetch usage snapshot: ${res.status}`);
    return res.json();
  }
}

export const usageAnalytics = new UsageAnalyticsService();
