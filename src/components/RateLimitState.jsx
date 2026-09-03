import React from "react";
import { AlertTriangle, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/hooks/useCountdown";

/**
 * Reusable rate-limit (429) error state.
 * - Shows countdown from retryAfter (seconds)
 * - Disables retry button until countdown reaches 0
 * - After countdown, enables a single manual retry
 * - Does NOT auto-retry
 */
export default function RateLimitState({ retryAfter = 60, onRetry, message, children }) {
  const { secondsLeft, canRetry } = useCountdown(retryAfter);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m > 0) return `${m}:${String(sec).padStart(2, "0")}`;
    return `${sec}`;
  };

  return (
    <div className="text-center py-16" dir="rtl">
      <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
      <p className="text-slate-600 mb-2">
        {message || "עומס זמני בשרת. נסו שוב בעוד זמן קצר."}
      </p>
      {!canRetry ? (
        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
          <Clock className="w-4 h-4" />
          <span>ניתן לנסות שוב בעוד {formatTime(secondsLeft)}</span>
        </div>
      ) : (
        <Button variant="outline" onClick={onRetry} className="mt-4">
          <RefreshCw className="w-4 h-4 ml-2" />
          נסה שוב
        </Button>
      )}
      {children}
    </div>
  );
}