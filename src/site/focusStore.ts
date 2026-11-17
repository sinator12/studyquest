import { getCurrentUser } from "./authStore";
import { recordActivityToday } from "./studyStore";

export interface FocusSession {
  id: string;
  durationMinutes: number;
  mode: "focus" | "shortBreak" | "longBreak";
  completedAt: string;
  xpEarned: number;
  tag?: string;
}

export interface FocusTimerState {
  mode: "focus" | "shortBreak" | "longBreak";
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  totalCompletedSessions: number;
  totalFocusMinutes: number;
}

function getFocusKey(baseKey: string): string {
  const user = getCurrentUser();
  const userId = user ? user.id : "guest";
  return `sq_${userId}_${baseKey}`;
}

export function getCompletedFocusSessions(): FocusSession[] {
  try {
    const raw = localStorage.getItem(getFocusKey("focus_sessions"));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

/**
 * Record a successfully completed focus session
 * Automatically:
 * 1. Saves session to user's history
 * 2. Awards +50 XP
 * 3. Advances daily streak if not already active today!
 */
export function recordCompletedFocusSession(
  durationMinutes: number,
  mode: "focus" | "shortBreak" | "longBreak" = "focus",
  tag: string = "Deep Study"
): FocusSession {
  const xpEarned = mode === "focus" ? Math.max(10, Math.round(durationMinutes * 2)) : 5;
  const newSession: FocusSession = {
    id: "foc_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
    durationMinutes,
    mode,
    completedAt: new Date().toISOString(),
    xpEarned,
    tag
  };

  try {
    const sessions = getCompletedFocusSessions();
    sessions.unshift(newSession);
    // Keep last 100 sessions
    localStorage.setItem(getFocusKey("focus_sessions"), JSON.stringify(sessions.slice(0, 100)));

    // Update daily streak and award XP
    recordActivityToday(`Completed ${durationMinutes}m Focus Session`, xpEarned);

    window.dispatchEvent(new Event("sq_focus_updated"));
  } catch (e) {
    console.error("Failed to record focus session", e);
  }

  return newSession;
}

export function getTotalFocusMinutes(): number {
  const sessions = getCompletedFocusSessions().filter((s) => s.mode === "focus");
  return sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
}

export function getTodayFocusSessions(): FocusSession[] {
  const todayStr = new Date().toISOString().split("T")[0];
  return getCompletedFocusSessions().filter((s) => s.completedAt.startsWith(todayStr));
}
