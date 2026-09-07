import { useState, useEffect, useRef } from "react";

/**
 * Enterprise Throttle Hook
 */

export default function useThrottle(value, delay = 2000) {
  const [throttledValue, setThrottledValue] = useState(value);

  const lastExecuted = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();

    const remaining = delay - (now - lastExecuted.current);

    if (remaining <= 0) {
      lastExecuted.current = now;
      setThrottledValue(value);
      return;
    }

    const timer = setTimeout(() => {
      lastExecuted.current = Date.now();
      setThrottledValue(value);
    }, remaining);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return throttledValue;
}