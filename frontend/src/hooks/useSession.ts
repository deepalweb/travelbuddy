import { useState, useEffect, useCallback, useRef } from 'react';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry

export const useSession = (onExpire: () => void) => {
  const [timeRemaining, setTimeRemaining] = useState(SESSION_TIMEOUT);
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef(Date.now());

  const resetSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    setTimeRemaining(SESSION_TIMEOUT);
    setShowWarning(false);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    timeoutRef.current = setTimeout(() => {
      onExpire();
    }, SESSION_TIMEOUT);

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = SESSION_TIMEOUT - elapsed;
      setTimeRemaining(remaining);
      setShowWarning(remaining <= WARNING_TIME);
      
      if (remaining <= 0) {
        onExpire();
      }
    }, 1000);
  }, [onExpire]);

  useEffect(() => {
    resetSession();

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetSession);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      events.forEach(event => {
        document.removeEventListener(event, resetSession);
      });
    };
  }, [resetSession]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return { timeRemaining, showWarning, formatTime, resetSession };
};
