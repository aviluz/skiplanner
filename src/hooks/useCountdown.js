import { useState, useEffect } from "react";

/**
 * Countdown hook for rate-limit (429) retry-after enforcement.
 * - Starts counting down from `retryAfter` (seconds) when it changes.
 * - `canRetry` is false until the countdown reaches 0.
 * - No auto-retry; the consumer decides when to call retry.
 * - If retryAfter is null/0, canRetry is true immediately.
 *
 * @param {number|null|undefined} retryAfter - seconds to wait
 * @returns {{ secondsLeft: number, canRetry: boolean }}
 */
export function useCountdown(retryAfter) {
  const initial = retryAfter && retryAfter > 0 ? retryAfter : 0;
  const [secondsLeft, setSecondsLeft] = useState(initial);
  const [canRetry, setCanRetry] = useState(initial === 0);

  useEffect(() => {
    const start = retryAfter && retryAfter > 0 ? retryAfter : 0;
    setSecondsLeft(start);
    setCanRetry(start === 0);
    if (start <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanRetry(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  return { secondsLeft, canRetry };
}