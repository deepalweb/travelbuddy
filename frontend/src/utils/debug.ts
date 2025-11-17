// Debug utility to control console logging
const DEBUG_ENABLED = import.meta.env.DEV && localStorage.getItem('debug') === 'true';

export const debug = {
  log: (...args: any[]) => {
    if (DEBUG_ENABLED) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (DEBUG_ENABLED) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always show errors
    console.error(...args);
  }
};

// Enable debug logging by running: localStorage.setItem('debug', 'true')
// Disable debug logging by running: localStorage.removeItem('debug')
