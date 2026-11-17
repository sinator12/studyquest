import { useEffect, useRef } from "react";

export interface InactivityNudgeOptions {
  active: boolean;
  paused: boolean;
  questionKey: number;
  enabled: boolean;
  onNudge: (step: 1 | 2 | 3 | 4) => void;
  onDeactivate: () => void;
}

const schedule = [
  { afterMs: 10_000, step: 1 as const },
  { afterMs: 20_000, step: 2 as const },
  { afterMs: 30_000, step: 3 as const },
  { afterMs: 45_000, step: 4 as const },
];

export function useInactivityNudge({
  active,
  paused,
  questionKey,
  enabled,
  onNudge,
  onDeactivate,
}: InactivityNudgeOptions): void {
  const callbacks = useRef({ onNudge, onDeactivate });
  callbacks.current = { onNudge, onDeactivate };

  useEffect(() => {
    if (!active || paused || !enabled || document.hidden) return;

    const timers: number[] = [];
    let hidden = false;

    schedule.forEach(({ afterMs, step }) => {
      timers.push(
        window.setTimeout(() => {
          if (!hidden && !document.hidden) callbacks.current.onNudge(step);
        }, afterMs),
      );
    });

    const handleVisibility = () => {
      if (!document.hidden || hidden) return;
      hidden = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      callbacks.current.onDeactivate();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [active, paused, enabled, questionKey]);
}
