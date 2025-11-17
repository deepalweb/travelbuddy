// Security utilities for frontend

let csrfToken: string | null = null;

/**
 * Get CSRF token from server
 */
export const getCsrfToken = async (): Promise<string> => {
  if (csrfToken) {
    return csrfToken;
  }

  try {
    const response = await fetch('/api/csrf-token');
    const data = await response.json();
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    // Generate a fallback token
    return Math.random().toString(36).substring(2, 15);
  }
};

/**
 * Add CSRF token to request headers
 */
export const addCsrfToken = async (headers: Record<string, string> = {}): Promise<Record<string, string>> => {
  const token = await getCsrfToken();
  return {
    ...headers,
    'X-CSRF-Token': token
  };
};

/**
 * Secure fetch wrapper with CSRF protection
 */
export const secureFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const method = options.method?.toUpperCase() || 'GET';
  
  // Add CSRF token for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const headers = await addCsrfToken(options.headers as Record<string, string>);
    options.headers = headers;
  }

  return fetch(url, options);
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Rate limiting helper for client-side
 */
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }

  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
}

export const apiRateLimiter = new RateLimiter(50, 60000); // 50 requests per minute
