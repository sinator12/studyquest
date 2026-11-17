import { useState, useEffect } from "react";
import { getActiveDeck, getPlayerStats, type DeckInfo, type PlayerStats } from "./studyStore";

interface TopNavProps {
  activeTab?: "games" | "dashboard" | "study-plan" | "explain";
  onOpenReviewerModal?: () => void;
}

export default function TopNav({ activeTab = "dashboard", onOpenReviewerModal }: TopNavProps) {
  const [deck, setDeck] = useState<DeckInfo>(getActiveDeck());
  const [stats, setStats] = useState<PlayerStats>(getPlayerStats());
  const [timeRemaining] = useState<string>("25:00");

  useEffect(() => {
    const handleDeckUpdate = () => setDeck(getActiveDeck());
    const handleStatsUpdate = () => setStats(getPlayerStats());

    window.addEventListener("sq_deck_updated", handleDeckUpdate);
    window.addEventListener("sq_stats_updated", handleStatsUpdate);
    return () => {
      window.removeEventListener("sq_deck_updated", handleDeckUpdate);
      window.removeEventListener("sq_stats_updated", handleStatsUpdate);
    };
  }, []);

  return (
    <header className="sq-main-nav">
      <div className="sq-nav-inner">
        {/* Brand / Logo matching photo 1 */}
        <a href="/dashboard" className="sq-nav-brand">
          <div className="sq-brand-icon-box">
            <svg viewBox="0 0 36 36" width="34" height="34" fill="none">
              <rect width="36" height="36" rx="10" fill="#6D28D9" />
              {/* Controller ears / handles */}
              <rect x="7" y="16" width="22" height="12" rx="6" fill="#7C3AED" />
              {/* Golden Face */}
              <circle cx="18" cy="18" r="8.5" fill="#FFA500" />
              {/* Eyes */}
              <circle cx="15" cy="17" r="1.6" fill="#1E1B4B" />
              <circle cx="21" cy="17" r="1.6" fill="#1E1B4B" />
              {/* Cute smile */}
              <path d="M16 20.5C16.8 21.6 19.2 21.6 20 20.5" stroke="#1E1B4B" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <span className="sq-brand-text">StudyQuest</span>
        </a>

        {/* Center navigation pills matching photo 1 */}
        <nav className="sq-nav-links-center">
          <a
            href="/games"
            className={`sq-nav-pill ${activeTab === "games" ? "active" : ""}`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="2" y="6" width="20" height="12" rx="3" />
              <line x1="6" y1="12" x2="10" y2="12" />
              <line x1="8" y1="10" x2="8" y2="14" />
              <circle cx="15.5" cy="12" r="0.7" fill="currentColor" />
              <circle cx="18" cy="12" r="0.7" fill="currentColor" />
            </svg>
            <span>Games</span>
          </a>

          <a
            href="/dashboard"
            className={`sq-nav-pill ${activeTab === "dashboard" ? "active" : ""}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span>Dashboard</span>
          </a>

          <a
            href="/study-plan"
            className={`sq-nav-pill ${activeTab === "study-plan" ? "active" : ""}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="4" y="2" width="16" height="20" rx="2.5" />
              <line x1="8" y1="7" x2="16" y2="7" />
              <line x1="8" y1="11" x2="16" y2="11" />
              <line x1="8" y1="15" x2="12" y2="15" />
            </svg>
            <span className="sq-nav-stacked">
              <span>Study</span>
              <span>Plan</span>
            </span>
          </a>

          <a
            href="/explain"
            className={`sq-nav-pill ${activeTab === "explain" ? "active" : ""}`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="9.5" />
              <polygon points="10 8 16 12 10 16 10 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <span>Explain</span>
          </a>
        </nav>

        {/* Right tools matching photo 1 without 'Go Premium' */}
        <div className="sq-nav-right-tools">
          {/* Active reviewer badge pill matching photo 1 */}
          <button
            type="button"
            className="sq-material-pill"
            onClick={onOpenReviewerModal ? onOpenReviewerModal : () => { window.location.href = "/dashboard"; }}
            title="Click to change or add study notes"
          >
            <span className="sq-green-dot" />
            <div className="sq-material-info">
              <span className="sq-material-line">{deck ? deck.questions.length : 8} questions</span>
              <span className="sq-material-line">ready</span>
            </div>
            <div className="sq-material-action">
              <span className="sq-material-line sq-underline">Replace</span>
              <span className="sq-material-line sq-underline">material</span>
            </div>
          </button>

          {/* Pomodoro timer pill */}
          <div className="sq-stat-chip sq-timer-chip" title="Study timer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
            <span>{timeRemaining}</span>
          </div>

          {/* Level chip */}
          <div className="sq-stat-chip sq-level-chip" title="Level">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Lv.{stats.level || 1}</span>
          </div>

          {/* Streak chip */}
          <div className="sq-stat-chip sq-streak-chip" title="Daily streak">
            <span className="sq-flame-icon">🔥</span>
            <span>{stats.streak || 2}</span>
          </div>

          {/* Flag */}
          <div className="sq-flag-icon" title="English (US)">
            <img src="https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/us.svg" alt="US Flag" width="20" height="14" />
          </div>

          {/* User Profile */}
          <a href="/dashboard" className="sq-avatar-pill" title="Your Account">
            <span className="sq-avatar-initials">U</span>
          </a>
        </div>
      </div>
    </header>
  );
}
