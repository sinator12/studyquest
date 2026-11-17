import React, { useState, useEffect } from "react";
import { getPlayerStats, recordActivityToday, type PlayerStats } from "./studyStore";

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StreakModal({ isOpen, onClose }: StreakModalProps) {
  const [stats, setStats] = useState<PlayerStats>(getPlayerStats());

  useEffect(() => {
    const handleUpdate = () => setStats(getPlayerStats());
    window.addEventListener("sq_stats_updated", handleUpdate);
    return () => window.removeEventListener("sq_stats_updated", handleUpdate);
  }, []);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split("T")[0];
  const isActiveToday = stats.lastActiveDate === todayStr;

  // Generate 7 days of the current week for visual checkmarks
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentDayIdx = new Date().getDay();

  return (
    <div className="sq-modal-overlay" onClick={onClose}>
      <div className="sq-modal-card sq-streak-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sq-modal-head">
          <div className="sq-modal-title-row">
            <span className="sq-modal-icon">🔥</span>
            <div>
              <h3>Daily Study Streak</h3>
              <p>Build consistent study habits by studying or focusing every day.</p>
            </div>
          </div>
          <button type="button" className="sq-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Big Flame Streak Hero */}
        <div className="sq-streak-hero-card">
          <div className="sq-streak-flame-icon">🔥</div>
          <div className="sq-streak-hero-content">
            <h2>{stats.streak || 1} Day Streak!</h2>
            <p className="sq-streak-status-text">
              {isActiveToday ? (
                <span className="sq-streak-badge-active">✓ You studied today! Streak preserved.</span>
              ) : (
                <span className="sq-streak-badge-pending">⚠️ Study or start a focus session today to keep your streak!</span>
              )}
            </p>
          </div>
        </div>

        {/* 7-Day Visual Week Progress */}
        <div className="sq-streak-week-tracker">
          <h4>This Week</h4>
          <div className="sq-week-circles-row">
            {daysOfWeek.map((dayName, idx) => {
              const isPast = idx < currentDayIdx;
              const isToday = idx === currentDayIdx;
              let statusCls = "upcoming";

              if (isPast) statusCls = "completed";
              else if (isToday) statusCls = isActiveToday ? "completed" : "active-today";

              return (
                <div key={dayName} className={`sq-day-col ${statusCls}`}>
                  <span className="sq-day-name">{dayName}</span>
                  <div className="sq-day-circle">
                    {statusCls === "completed" ? "✓" : isToday ? (isActiveToday ? "✓" : "•") : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Streak Milestones & Rewards */}
        <div className="sq-streak-milestones-card">
          <h4>Streak Milestones</h4>
          <div className="sq-milestones-list">
            <div className={`sq-milestone-item ${stats.streak >= 3 ? "achieved" : ""}`}>
              <span className="sq-mile-icon">🥉</span>
              <div className="sq-mile-info">
                <strong>3-Day Habit</strong>
                <small>+100 Coins & 50 XP bonus</small>
              </div>
              <span className="sq-mile-check">{stats.streak >= 3 ? "✓ Achieved" : "In Progress"}</span>
            </div>

            <div className={`sq-milestone-item ${stats.streak >= 7 ? "achieved" : ""}`}>
              <span className="sq-mile-icon">🥈</span>
              <div className="sq-mile-info">
                <strong>7-Day Dedicated</strong>
                <small>+250 Coins & 150 XP bonus</small>
              </div>
              <span className="sq-mile-check">{stats.streak >= 7 ? "✓ Achieved" : `${Math.max(0, 7 - stats.streak)} days to go`}</span>
            </div>

            <div className={`sq-milestone-item ${stats.streak >= 30 ? "achieved" : ""}`}>
              <span className="sq-mile-icon">🥇</span>
              <div className="sq-mile-info">
                <strong>30-Day Master</strong>
                <small>Golden Profile Frame & +1000 Coins</small>
              </div>
              <span className="sq-mile-check">{stats.streak >= 30 ? "✓ Achieved" : `${Math.max(0, 30 - stats.streak)} days to go`}</span>
            </div>
          </div>
        </div>

        {/* Quick Check-in action if not active */}
        {!isActiveToday && (
          <div className="sq-streak-action-box">
            <button
              type="button"
              className="sq-streak-checkin-btn"
              onClick={() => {
                recordActivityToday("Manual Daily Check-in", 25);
              }}
            >
              ⚡ Complete Daily Check-in (+25 XP)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
