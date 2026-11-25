import { useState, useEffect } from "react";
import { getActiveDeck, getPlayerStats, type DeckInfo, type PlayerStats } from "./studyStore";
import { getCurrentUser, isDemoMode, exitDemoMode, type UserProfile } from "./authStore";
import { signOutOAuth } from "./supabaseClient";
import { recordCompletedFocusSession } from "./focusStore";
import GoogleLoginModal from "./GoogleLoginModal";
import FocusTimerModal from "./FocusTimerModal";
import LevelModal from "./LevelModal";
import StreakModal from "./StreakModal";
import AccountSwitcherModal from "./AccountSwitcherModal";
import UserProfileModal from "./UserProfileModal";
import "./topNav.css";

interface TopNavProps {
  activeTab?: "games" | "dashboard" | "study-plan" | "explain";
  onOpenReviewerModal?: () => void;
}

export default function TopNav({ activeTab = "dashboard", onOpenReviewerModal }: TopNavProps) {
  const [deck, setDeck] = useState<DeckInfo>(getActiveDeck());
  const [stats, setStats] = useState<PlayerStats>(getPlayerStats());
  const [user, setUser] = useState<UserProfile | null>(getCurrentUser());
  const [demoMode, setDemoMode] = useState<boolean>(isDemoMode());

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [isSwitcherModalOpen, setIsSwitcherModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Focus Timer Active State (Default 25 minutes = 1500s)
  const [timerMode, setTimerMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Sync stores
  useEffect(() => {
    const handleDeckUpdate = () => setDeck(getActiveDeck());
    const handleStatsUpdate = () => setStats(getPlayerStats());
    const handleAuthUpdate = () => {
      setUser(getCurrentUser());
      setDemoMode(isDemoMode());
    };

    window.addEventListener("sq_deck_updated", handleDeckUpdate);
    window.addEventListener("sq_stats_updated", handleStatsUpdate);
    window.addEventListener("sq_auth_changed", handleAuthUpdate);
    return () => {
      window.removeEventListener("sq_deck_updated", handleDeckUpdate);
      window.removeEventListener("sq_stats_updated", handleStatsUpdate);
      window.removeEventListener("sq_auth_changed", handleAuthUpdate);
    };
  }, []);

  // Timer Tick Interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((s) => s - 1);
      }, 1000);
    } else if (remainingSeconds === 0 && isTimerRunning) {
      // Completed!
      setIsTimerRunning(false);
      const min = Math.round(totalDurationSeconds / 60);
      recordCompletedFocusSession(min, timerMode);

      // Play subtle chime sound
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
      } catch (e) {}

      alert(`🎉 ${timerMode === "focus" ? "Focus session" : "Break"} completed! +50 XP and daily streak updated!`);
      // Reset for next session
      handleSetMode(timerMode === "focus" ? "shortBreak" : "focus");
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, remainingSeconds, totalDurationSeconds, timerMode]);

  // Handle Mode Change
  const handleSetMode = (mode: "focus" | "shortBreak" | "longBreak") => {
    setTimerMode(mode);
    setIsTimerRunning(false);
    let dur = 25 * 60;
    if (mode === "shortBreak") dur = 5 * 60;
    if (mode === "longBreak") dur = 15 * 60;
    setTotalDurationSeconds(dur);
    setRemainingSeconds(dur);
  };

  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setRemainingSeconds(totalDurationSeconds);
  };

  const handleSkipTimer = () => {
    setIsTimerRunning(false);
    const min = Math.round(totalDurationSeconds / 60);
    recordCompletedFocusSession(min, timerMode);
    handleSetMode(timerMode === "focus" ? "shortBreak" : "focus");
  };

  // Formatted timer string (mm:ss)
  const timerMinutes = Math.floor(remainingSeconds / 60);
  const timerSecs = remainingSeconds % 60;
  const timeFormatted = `${timerMinutes.toString().padStart(2, "0")}:${timerSecs.toString().padStart(2, "0")}`;

  return (
    <>
      <header className="sq-main-nav">
        <div className="sq-nav-inner">
          {/* Brand / Logo */}
          <a href="/dashboard" className="sq-nav-brand">
            <div className="sq-brand-icon-box">
              <svg viewBox="0 0 36 36" width="34" height="34" fill="none">
                <rect width="36" height="36" rx="10" fill="#6D28D9" />
                <rect x="7" y="16" width="22" height="12" rx="6" fill="#7C3AED" />
                <circle cx="18" cy="18" r="8.5" fill="#FFA500" />
                <circle cx="15" cy="17" r="1.6" fill="#1E1B4B" />
                <circle cx="21" cy="17" r="1.6" fill="#1E1B4B" />
                <path d="M16 20.5C16.8 21.6 19.2 21.6 20 20.5" stroke="#1E1B4B" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <span className="sq-brand-text">EduQuest</span>
          </a>

          {/* Desktop center navigation pills */}
          <nav className="sq-nav-links-center">
            <a href="/games" className={`sq-nav-pill ${activeTab === "games" ? "active" : ""}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="2" y="6" width="20" height="12" rx="3" />
                <line x1="6" y1="12" x2="10" y2="12" />
                <line x1="8" y1="10" x2="8" y2="14" />
                <circle cx="15.5" cy="12" r="0.7" fill="currentColor" />
                <circle cx="18" cy="12" r="0.7" fill="currentColor" />
              </svg>
              <span>Games</span>
            </a>

            <a href="/dashboard" className={`sq-nav-pill ${activeTab === "dashboard" ? "active" : ""}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span>Dashboard</span>
            </a>

            <a href="/study-plan" className={`sq-nav-pill ${activeTab === "study-plan" ? "active" : ""}`}>
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

            <a href="/explain" className={`sq-nav-pill ${activeTab === "explain" ? "active" : ""}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="9.5" />
                <polygon points="10 8 16 12 10 16 10 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              <span>Explain</span>
            </a>
          </nav>

          {/* Right Tools (All Fully Interactive!) */}
          <div className="sq-nav-right-tools">
            {/* Active reviewer badge pill */}
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

            {/* 1. FULLY FUNCTIONAL POMODORO FOCUS TIMER */}
            <button
              type="button"
              className={`sq-stat-chip sq-timer-chip ${isTimerRunning ? "running" : ""}`}
              onClick={() => setIsTimerModalOpen(true)}
              title="Click to open Pomodoro Focus Timer controls"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 14" />
              </svg>
              <span>{timeFormatted}</span>
              {isTimerRunning && <span className="sq-timer-pulse-dot" />}
            </button>

            {/* 2. FULLY FUNCTIONAL LEVEL & XP PROGRESS */}
            <button
              type="button"
              className="sq-stat-chip sq-level-chip"
              onClick={() => setIsLevelModalOpen(true)}
              title={`Level ${stats.level} (${stats.xp}/${stats.nextLevelXp} XP) - Click to view progress`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Lv.{stats.level || 1}</span>
            </button>

            {/* 3. FULLY FUNCTIONAL DAILY STREAK TRACKING */}
            <button
              type="button"
              className="sq-stat-chip sq-streak-chip"
              onClick={() => setIsStreakModalOpen(true)}
              title={`${stats.streak || 1} Day Streak - Click to view calendar & rewards`}
            >
              <span className="sq-flame-icon">🔥</span>
              <span>{stats.streak || 1}</span>
            </button>

              {/* 4. GOOGLE ACCOUNT SYSTEM & SWITCHER */}
            <div className="sq-user-menu-container">
              {user ? (
                <>
                  <button
                    type="button"
                    className="sq-avatar-pill signed-in"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    title={`${user.name} (${user.email}) - Click for account menu`}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      <span className="sq-avatar-initials">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </button>

                  {isUserMenuOpen && (
                    <div className="sq-user-dropdown">
                      <div className="sq-user-drop-info">
                        <span className="sq-user-drop-name">{user.name}</span>
                        <span className="sq-user-drop-email">{user.email}</span>
                        <span className="sq-user-drop-tag">✓ Google Account</span>
                      </div>

                      <button
                        type="button"
                        className="sq-user-drop-action"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                      >
                        View Profile &amp; Settings
                      </button>

                      <button
                        type="button"
                        className="sq-user-drop-action"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsSwitcherModalOpen(true);
                        }}
                      >
                        Switch Account
                      </button>

                      <button
                        type="button"
                        className="sq-user-drop-action"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsLoginModalOpen(true);
                        }}
                      >
                        Add Another Account
                      </button>

                      <button
                        type="button"
                        className="sq-user-drop-signout"
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await signOutOAuth();
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="sq-demo-nav-actions">
                  {demoMode && <span className="sq-demo-badge-pill">Demo</span>}
                  <button
                    type="button"
                    className="sq-signin-nav-btn"
                    onClick={() => setIsLoginModalOpen(true)}
                    title="Sign in with your Google Account"
                  >
                    <span>Sign In</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {demoMode && !user && (
        <div className="sq-demo-banner-strip" role="status">
          <div className="sq-demo-banner-inner">
            <span>
              <strong>Demo Preview:</strong> Study Café (5 Qs), Line Bingo, and 2 topic/text previews are open. Sign in to unlock document uploads, Study Plans, Full Card Bingo, and saved XP.
            </span>
            <div className="sq-demo-banner-btns">
              <button
                type="button"
                className="sq-demo-banner-cta"
                onClick={() => setIsLoginModalOpen(true)}
              >
                Sign In to Unlock All
              </button>
              <button
                type="button"
                className="sq-demo-banner-exit"
                onClick={() => exitDemoMode()}
              >
                Exit Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Fixed to viewport bottom on screens <= 768px) */}
      <nav className="sq-mobile-bottom-bar" aria-label="Mobile Navigation">
        <a href="/games" className={`sq-mob-tab ${activeTab === "games" ? "active" : ""}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="2" y="6" width="20" height="12" rx="3" />
            <line x1="6" y1="12" x2="10" y2="12" />
            <line x1="8" y1="10" x2="8" y2="14" />
            <circle cx="15.5" cy="12" r="0.7" fill="currentColor" />
            <circle cx="18" cy="12" r="0.7" fill="currentColor" />
          </svg>
          <span>Games</span>
        </a>

        <a href="/dashboard" className={`sq-mob-tab ${activeTab === "dashboard" ? "active" : ""}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span>Dashboard</span>
        </a>

        <a href="/study-plan" className={`sq-mob-tab ${activeTab === "study-plan" ? "active" : ""}`}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="4" y="2" width="16" height="20" rx="2.5" />
            <line x1="8" y1="7" x2="16" y2="7" />
            <line x1="8" y1="11" x2="16" y2="11" />
            <line x1="8" y1="15" x2="12" y2="15" />
          </svg>
          <span>Plan</span>
        </a>

        <a href="/explain" className={`sq-mob-tab ${activeTab === "explain" ? "active" : ""}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="9.5" />
            <polygon points="10 8 16 12 10 16 10 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <span>Explain</span>
        </a>
      </nav>

        {/* Focus Timer Modal */}
        <FocusTimerModal
          isOpen={isTimerModalOpen}
          onClose={() => setIsTimerModalOpen(false)}
          mode={timerMode}
          setMode={handleSetMode}
          remainingSeconds={remainingSeconds}
          totalDurationSeconds={totalDurationSeconds}
          isRunning={isTimerRunning}
          onToggleTimer={handleToggleTimer}
          onResetTimer={handleResetTimer}
          onSkipTimer={handleSkipTimer}
        />

        {/* Level & XP Progress Modal */}
        <LevelModal isOpen={isLevelModalOpen} onClose={() => setIsLevelModalOpen(false)} />

        {/* Daily Streak Modal */}
        <StreakModal isOpen={isStreakModalOpen} onClose={() => setIsStreakModalOpen(false)} />

        {/* Account Switcher Modal */}
        <AccountSwitcherModal
          isOpen={isSwitcherModalOpen}
          onClose={() => setIsSwitcherModalOpen(false)}
          onOpenGoogleLogin={() => setIsLoginModalOpen(true)}
        />

        {/* Google Login / Sign-up Modal */}
        <GoogleLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => setIsLoginModalOpen(false)}
        />

        {/* User Profile & Account Settings Modal */}
        <UserProfileModal
          isOpen={isProfileModalOpen}
          user={user}
          onClose={() => setIsProfileModalOpen(false)}
          onOpenSwitcher={() => setIsSwitcherModalOpen(true)}
        />
    </>
  );
}
