import React, { useState, useEffect } from "react";
import { getPlayerStats, getRequiredXpForLevel, type PlayerStats } from "./studyStore";

interface LevelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LevelModal({ isOpen, onClose }: LevelModalProps) {
  const [stats, setStats] = useState<PlayerStats>(getPlayerStats());

  useEffect(() => {
    const handleUpdate = () => setStats(getPlayerStats());
    window.addEventListener("sq_stats_updated", handleUpdate);
    return () => window.removeEventListener("sq_stats_updated", handleUpdate);
  }, []);

  if (!isOpen) return null;

  const currentLevel = stats.level;
  const currentXp = stats.xp;
  const nextLevelXp = stats.nextLevelXp || getRequiredXpForLevel(currentLevel);
  const xpNeeded = Math.max(0, nextLevelXp - currentXp);
  const progressPercent = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));

  const getLevelTitle = (lvl: number) => {
    if (lvl <= 1) return "Novice Scholar";
    if (lvl === 2) return "Apprentice Reader";
    if (lvl === 3) return "Journeyman Thinker";
    if (lvl === 4) return "Master of Notes";
    if (lvl === 5) return "Grand Archivist";
    return `Study Luminary Tier ${lvl}`;
  };

  return (
    <div className="sq-modal-overlay" onClick={onClose}>
      <div className="sq-modal-card sq-level-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sq-modal-head">
          <div className="sq-modal-title-row">
            <span className="sq-modal-icon">⚡</span>
            <div>
              <h3>Level & Experience (XP)</h3>
              <p>Earn XP by answering study questions, completing focus sessions, and practicing games.</p>
            </div>
          </div>
          <button type="button" className="sq-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Level Banner */}
        <div className="sq-level-hero-card">
          <div className="sq-level-badge-large">
            <span className="sq-lvl-num">{currentLevel}</span>
            <span className="sq-lvl-tag">LEVEL</span>
          </div>

          <div className="sq-level-hero-info">
            <h4 className="sq-level-rank-name">{getLevelTitle(currentLevel)}</h4>
            <p className="sq-level-xp-summary">
              <strong>{currentXp}</strong> / {nextLevelXp} XP to Level {currentLevel + 1}
            </p>

            {/* Progress Bar */}
            <div className="sq-level-bar-track">
              <div className="sq-level-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>

            <span className="sq-level-needed-hint">
              {xpNeeded > 0 ? `Only ${xpNeeded} XP needed to reach Level ${currentLevel + 1}!` : "Ready to Level Up!"}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="sq-level-stats-grid">
          <div className="sq-lstat-box">
            <span className="lbl">TOTAL XP EARNED</span>
            <span className="val">{stats.totalXp || currentXp} XP</span>
          </div>
          <div className="sq-lstat-box">
            <span className="lbl">COINS IN BANK</span>
            <span className="val gold">💰 {stats.coins}</span>
          </div>
          <div className="sq-lstat-box">
            <span className="lbl">STARS COLLECTED</span>
            <span className="val star">⭐ {stats.stars}</span>
          </div>
        </div>

        {/* How to earn XP */}
        <div className="sq-level-ways-to-earn">
          <h4>Ways to Earn XP & Level Up</h4>
          <div className="sq-earn-pills">
            <span className="sq-earn-pill">☕ Serve Café Orders: <strong>+15 XP</strong></span>
            <span className="sq-earn-pill">🎯 Destroy Angry Nerds Fort: <strong>+25 XP</strong></span>
            <span className="sq-earn-pill">⏱️ Complete 25m Focus: <strong>+50 XP</strong></span>
            <span className="sq-earn-pill">📅 Daily Streak Bonus: <strong>+25 XP</strong></span>
          </div>
        </div>

        {/* Recent XP Activity Feed */}
        {stats.recentXpEvents && stats.recentXpEvents.length > 0 && (
          <div className="sq-recent-xp-section">
            <h4>Recent XP Activity</h4>
            <div className="sq-xp-events-list">
              {stats.recentXpEvents.slice(0, 5).map((evt) => (
                <div key={evt.id} className="sq-xp-event-row">
                  <span className="sq-xp-event-reason">{evt.reason}</span>
                  <span className="sq-xp-event-badge">+{evt.xp} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
