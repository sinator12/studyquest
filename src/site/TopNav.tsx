import { useState, useEffect } from "react";
import { getActiveDeck, getPlayerStats, type DeckInfo, type PlayerStats } from "./studyStore";

interface TopNavProps {
  activeTab?: "games" | "dashboard" | "study-plan" | "explain";
  onOpenReviewerModal?: () => void;
}

export default function TopNav({ activeTab = "games", onOpenReviewerModal }: TopNavProps) {
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
        {/* Brand / Logo */}
        <a href="/games" className="sq-nav-brand">
          <svg className="sq-brain-icon" viewBox="0 0 40 40" width="34" height="34" fill="none">
            <rect width="40" height="40" rx="10" fill="#7C3AED" />
            <path d="M12 20C12 15.58 15.58 12 20 12C24.42 12 28 15.58 28 20V26C28 28.2 26.2 30 24 30H16C13.8 30 12 28.2 12 26V20Z" fill="#FFA826" />
            <circle cx="17" cy="21" r="2" fill="#2A1600" />
            <circle cx="23" cy="21" r="2" fill="#2A1600" />
            <path d="M18 25Q20 27 22 25" stroke="#2A1600" strokeWidth="1.5" strokeLinecap="round" />
            {/* Gamepad d-pad & buttons */}
            <path d="M8 24H10M9 23V25" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="31" cy="23" r="1" fill="#FFF" />
            <circle cx="33" cy="25" r="1" fill="#FFF" />
          </svg>
          <span className="sq-brand-text">StudyQuest</span>
        </a>

        {/* Center navigation pills */}
        <nav className="sq-nav-links-center">
          <a
            href="/games"
            className={`sq-nav-pill ${activeTab === "games" ? "active" : ""}`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 12h4m-2-2v4m10-2h.01m-3 0h.01" /></svg>
            <span>Games</span>
          </a>
          <a
            href="/dashboard"
            className={`sq-nav-pill ${activeTab === "dashboard" ? "active" : ""}`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
            <span>Dashboard</span>
          </a>
          <a
            href="/dashboard"
            className={`sq-nav-pill ${activeTab === "study-plan" ? "active" : ""}`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
            <span>Study Plan</span>
          </a>
          <a
            href="/dashboard"
            className={`sq-nav-pill ${activeTab === "explain" ? "active" : ""}`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
            <span>Explain</span>
          </a>
        </nav>

        {/* Right tools and profile */}
        <div className="sq-nav-right-tools">
          {/* Active reviewer badge pill */}
          {deck && deck.questions.length > 0 && (
            <button
              type="button"
              className="sq-material-pill"
              onClick={onOpenReviewerModal ? onOpenReviewerModal : () => { window.location.href = "/dashboard"; }}
              title="Click to change or add study notes"
            >
              <span className="sq-green-dot" />
              <span className="sq-deck-count">{deck.questions.length} questions ready</span>
              <span className="sq-replace-link">Replace material</span>
            </button>
          )}

          {/* Pomodoro timer pill */}
          <div className="sq-stat-chip sq-timer-chip" title="Study timer">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            <span>{timeRemaining}</span>
          </div>

          {/* Level chip */}
          <div className="sq-stat-chip sq-level-chip" title="Level and XP">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            <span>Lv.{stats.level}</span>
          </div>

          {/* Streak chip */}
          <div className="sq-stat-chip sq-streak-chip" title="Daily streak">
            <span>🔥 {stats.streak}</span>
          </div>

          {/* Premium CTA */}
          <a href="/dashboard" className="sq-premium-btn">
            <span>👑 Go Premium</span>
          </a>

          {/* Flag */}
          <div className="sq-flag-icon" title="English">
            <img src="https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/us.svg" alt="US Flag" width="20" height="15" />
          </div>

          {/* User Profile */}
          <a href="/dashboard" className="sq-avatar-pill" title="Your Profile">
            <span className="sq-avatar-initials">U</span>
          </a>
        </div>
      </div>
    </header>
  );
}
