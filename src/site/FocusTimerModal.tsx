import React, { useState, useEffect } from "react";
import { recordCompletedFocusSession, getTodayFocusSessions, getTotalFocusMinutes, type FocusSession } from "./focusStore";

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Shared timer state passed from TopNav
  mode: "focus" | "shortBreak" | "longBreak";
  setMode: (m: "focus" | "shortBreak" | "longBreak") => void;
  remainingSeconds: number;
  totalDurationSeconds: number;
  isRunning: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSkipTimer: () => void;
}

export default function FocusTimerModal({
  isOpen,
  onClose,
  mode,
  setMode,
  remainingSeconds,
  totalDurationSeconds,
  isRunning,
  onToggleTimer,
  onResetTimer,
  onSkipTimer
}: FocusTimerModalProps) {
  const [history, setHistory] = useState<FocusSession[]>(getTodayFocusSessions());
  const [totalMin, setTotalMin] = useState<number>(getTotalFocusMinutes());

  useEffect(() => {
    const handleUpdate = () => {
      setHistory(getTodayFocusSessions());
      setTotalMin(getTotalFocusMinutes());
    };
    window.addEventListener("sq_focus_updated", handleUpdate);
    return () => window.removeEventListener("sq_focus_updated", handleUpdate);
  }, []);

  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Progress percentage (100% at start -> 0% at end)
  const progressPercent = totalDurationSeconds > 0
    ? Math.round(((totalDurationSeconds - remainingSeconds) / totalDurationSeconds) * 100)
    : 0;

  return (
    <div className="sq-modal-overlay" onClick={onClose}>
      <div className="sq-modal-card sq-timer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sq-modal-head">
          <div className="sq-modal-title-row">
            <span className="sq-modal-icon">⏱️</span>
            <div>
              <h3>Pomodoro Focus Timer</h3>
              <p>Stay in the zone, earn XP, and keep your daily streak alive!</p>
            </div>
          </div>
          <button type="button" className="sq-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Mode Selector Tabs (Defaults: 25m focus, 5m break, 15m long break) */}
        <div className="sq-timer-modes">
          <button
            type="button"
            className={`sq-tmode-btn ${mode === "focus" ? "active" : ""}`}
            onClick={() => setMode("focus")}
          >
            🎯 Focus (25m)
          </button>
          <button
            type="button"
            className={`sq-tmode-btn ${mode === "shortBreak" ? "active" : ""}`}
            onClick={() => setMode("shortBreak")}
          >
            ☕ Short Break (5m)
          </button>
          <button
            type="button"
            className={`sq-tmode-btn ${mode === "longBreak" ? "active" : ""}`}
            onClick={() => setMode("longBreak")}
          >
            🌴 Long Break (15m)
          </button>
        </div>

        {/* Large Circular Countdown Display */}
        <div className="sq-timer-display-wrap">
          <div className="sq-timer-circle">
            <svg viewBox="0 0 100 100" className="sq-timer-svg">
              <circle cx="50" cy="50" r="44" className="sq-timer-circle-bg" />
              <circle
                cx="50"
                cy="50"
                r="44"
                className="sq-timer-circle-progress"
                style={{
                  strokeDasharray: 276.46,
                  strokeDashoffset: 276.46 - (276.46 * progressPercent) / 100
                }}
              />
            </svg>
            <div className="sq-timer-text-inner">
              <span className="sq-timer-time">{timeFormatted}</span>
              <span className="sq-timer-status">
                {isRunning ? (mode === "focus" ? "Deep Focus" : "Resting") : "Paused"}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="sq-timer-controls">
          <button
            type="button"
            className={`sq-timer-main-btn ${isRunning ? "pause" : "start"}`}
            onClick={onToggleTimer}
          >
            {isRunning ? "⏸ Pause" : "▶ Start Focus"}
          </button>
          <button type="button" className="sq-timer-sub-btn" onClick={onResetTimer} title="Reset Timer">
            ↺ Reset
          </button>
          <button type="button" className="sq-timer-sub-btn" onClick={onSkipTimer} title="Complete/Skip session">
            ⏭ Complete
          </button>
        </div>

        {/* Daily Stats Summary */}
        <div className="sq-timer-stats-bar">
          <div className="sq-tstat">
            <span className="lbl">TODAY'S SESSIONS</span>
            <span className="val">{history.length}</span>
          </div>
          <div className="sq-tstat">
            <span className="lbl">MINUTES FOCUSED</span>
            <span className="val">{totalMin}m</span>
          </div>
          <div className="sq-tstat">
            <span className="lbl">COMPLETION BONUS</span>
            <span className="val highlight">+50 XP</span>
          </div>
        </div>

        {/* Recent Session Log */}
        {history.length > 0 && (
          <div className="sq-timer-history-list">
            <h4>Today's Completed Sessions</h4>
            <div className="sq-thistory-items">
              {history.slice(0, 4).map((sess) => (
                <div key={sess.id} className="sq-thistory-row">
                  <span>✓ {sess.mode === "focus" ? "Focus Block" : "Break"} ({sess.durationMinutes} min)</span>
                  <span className="sq-thistory-xp">+{sess.xpEarned} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
