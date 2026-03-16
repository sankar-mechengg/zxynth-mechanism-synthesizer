import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for polling a URL at regular intervals.
 * Automatically stops when condition is met or max attempts exceeded.
 *
 * @param {object} options
 * @param {function} options.fetcher - Async function that fetches status. Should return { done: boolean, data: any }
 * @param {number} [options.interval=2000] - Poll interval in ms
 * @param {number} [options.maxAttempts=300] - Max poll attempts before timeout
 * @param {boolean} [options.enabled=false] - Whether polling is active
 * @param {function} [options.onProgress] - Called with fetcher result on each poll
 * @param {function} [options.onComplete] - Called when fetcher returns done=true
 * @param {function} [options.onError] - Called on fetch error
 * @param {function} [options.onTimeout] - Called when maxAttempts exceeded
 */
export default function usePolling({
  fetcher,
  interval = 2000,
  maxAttempts = 300,
  enabled = false,
  onProgress,
  onComplete,
  onError,
  onTimeout,
}) {
  const attemptRef = useRef(0);
  const timerRef = useRef(null);
  const enabledRef = useRef(enabled);

  // Keep ref in sync
  enabledRef.current = enabled;

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    attemptRef.current = 0;
  }, []);

  const poll = useCallback(async () => {
    if (!enabledRef.current) return;

    if (attemptRef.current >= maxAttempts) {
      stop();
      onTimeout?.();
      return;
    }

    attemptRef.current += 1;

    try {
      const result = await fetcher();

      if (!enabledRef.current) return; // Stopped while fetching

      if (result.done) {
        stop();
        onComplete?.(result.data);
      } else {
        onProgress?.(result.data);
        // Schedule next poll
        timerRef.current = setTimeout(poll, interval);
      }
    } catch (err) {
      if (!enabledRef.current) return;
      onError?.(err);
      // Retry with backoff on error (up to 3 retries)
      if (attemptRef.current < maxAttempts) {
        timerRef.current = setTimeout(poll, interval * 2);
      } else {
        stop();
        onTimeout?.();
      }
    }
  }, [fetcher, interval, maxAttempts, onProgress, onComplete, onError, onTimeout, stop]);

  useEffect(() => {
    if (enabled) {
      attemptRef.current = 0;
      timerRef.current = setTimeout(poll, interval);
    } else {
      stop();
    }

    return () => stop();
  }, [enabled, poll, interval, stop]);

  return { stop, attempts: attemptRef.current };
}
