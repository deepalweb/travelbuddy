// Centralized runtime configuration for API and WebSocket endpoints
// Priority order:
// - window overrides (for runtime injection on Azure/App Service)
// - Vite env variables (VITE_*) at build time
// - Production default: same-origin ('') so fetch('/api/...') works behind the same host
// - Development default: http://localhost:3001

const g: any = (typeof globalThis !== 'undefined' ? globalThis : {}) as any;

export const isProd = typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD;

function resolveApiBase(): string {
  const fromWindow = g.API_BASE || g.__API_BASE__ || g.VITE_API_BASE_URL;
  const fromEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '';
  if (fromWindow) return String(fromWindow).trim();
  if (fromEnv) return String(fromEnv).trim();
  // default: same-origin in prod, localhost in dev
  return isProd ? '' : 'http://localhost:3001';
}

export const API_BASE: string = resolveApiBase();

export function withApiBase(path: string): string {
  if (!path) return path;
  // Absolute URLs are returned unchanged
  if (/^https?:\/\//i.test(path) || /^wss?:\/\//i.test(path)) return path;
  // If API_BASE is empty string, this yields same-origin relative URL
  return `${API_BASE}${path}`;
}

export function getWebSocketBase(): string {
  const fromWindow = g.WEBSOCKET_URL || g.__WEBSOCKET_URL__;
  const fromEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_WEBSOCKET_URL) || '';
  if (fromWindow) return String(fromWindow).trim();
  if (fromEnv) return String(fromEnv).trim();

  // Derive from API_BASE if possible
  if (API_BASE) {
    try {
      const u = new URL(API_BASE);
      const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${u.host}`;
    } catch {
      // fall through
    }
  }

  // Same-origin fallback
  if (typeof window !== 'undefined' && window.location) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}`;
  }

  // Dev default
  return 'ws://localhost:3001';
}
