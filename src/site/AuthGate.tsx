import { useState, useEffect } from "react";
import { getCurrentUser, type UserProfile } from "./authStore";
import { signInWithGoogleOAuth, isSupabaseConfigured } from "./supabaseClient";
import { loginWithGoogle } from "./authStore";
import "./AuthGate.css";

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<UserProfile | null>(getCurrentUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  // Listen for auth changes (Supabase OAuth callback or manual login)
  useEffect(() => {
    const handleAuthChange = () => {
      setUser(getCurrentUser());
    };
    window.addEventListener("sq_auth_changed", handleAuthChange);

    // Small delay to allow Supabase session restore on first load
    const timer = setTimeout(() => {
      setUser(getCurrentUser());
      setIsCheckingSession(false);
    }, 600);

    return () => {
      window.removeEventListener("sq_auth_changed", handleAuthChange);
      clearTimeout(timer);
    };
  }, []);

  // Whenever auth changes, re-check user
  useEffect(() => {
    setUser(getCurrentUser());
  });

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    if (isSupabaseConfigured) {
      const { error: oauthError } = await signInWithGoogleOAuth();
      if (oauthError) {
        setIsLoading(false);
        setError(oauthError);
      }
      // Browser redirects to Google — no need to setIsLoading(false)
      return;
    }

    // Fallback: instant local account for testing
    setTimeout(() => {
      try {
        const newUser = loginWithGoogle({
          email: "demo.student@gmail.com",
          name: "Demo Scholar",
          avatar: ""
        });
        setUser(newUser);
        setIsLoading(false);
      } catch (e: any) {
        setError(e?.message || "Sign in failed. Please try again.");
        setIsLoading(false);
      }
    }, 400);
  };

  const handleCustomSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) {
      setError("Please enter your Google email address.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const newUser = loginWithGoogle({
        email: customEmail.trim(),
        name: customName.trim() || undefined
      });
      setUser(newUser);
      setIsLoading(false);
    } catch (e: any) {
      setError(e?.message || "Sign in failed. Please try again.");
      setIsLoading(false);
    }
  };

  // ── Still loading ──
  if (isCheckingSession) {
    return (
      <div className="aq-gate-loading">
        <div className="aq-gate-loading-logo">
          <svg viewBox="0 0 48 48" width="52" height="52" fill="none">
            <rect width="48" height="48" rx="14" fill="#6D28D9" />
            <rect x="9" y="22" width="30" height="16" rx="8" fill="#7C3AED" />
            <circle cx="24" cy="24" r="11" fill="#FFA500" />
            <circle cx="20" cy="22.5" r="2.1" fill="#1E1B4B" />
            <circle cx="28" cy="22.5" r="2.1" fill="#1E1B4B" />
            <path d="M21 27C21.8 28.2 26.2 28.2 27 27" stroke="#1E1B4B" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <div className="aq-gate-loading-spinner" />
      </div>
    );
  }

  // ── Logged in ── show the app
  if (user) {
    return <>{children}</>;
  }

  // ── Not logged in ── show the full-screen auth wall
  return (
    <div className="aq-gate">
      {/* Animated background orbs */}
      <div className="aq-gate-bg">
        <div className="aq-orb aq-orb-1" />
        <div className="aq-orb aq-orb-2" />
        <div className="aq-orb aq-orb-3" />
        <div className="aq-grid-pattern" />
      </div>

      <div className="aq-gate-content">
        {/* Left panel — branding & features */}
        <div className="aq-gate-left">
          <div className="aq-gate-brand">
            <div className="aq-gate-logo-wrap">
              <svg viewBox="0 0 48 48" width="56" height="56" fill="none">
                <rect width="48" height="48" rx="14" fill="#6D28D9" />
                <rect x="9" y="22" width="30" height="16" rx="8" fill="#7C3AED" />
                <circle cx="24" cy="24" r="11" fill="#FFA500" />
                <circle cx="20" cy="22.5" r="2.1" fill="#1E1B4B" />
                <circle cx="28" cy="22.5" r="2.1" fill="#1E1B4B" />
                <path d="M21 27C21.8 28.2 26.2 28.2 27 27" stroke="#1E1B4B" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <span className="aq-gate-brand-name">EduQuest</span>
            <span className="aq-gate-brand-tag">Study. Play. Level Up.</span>
          </div>

          <div className="aq-gate-headline">
            <h1>Turn studying into<br /><span className="aq-gradient-text">an adventure.</span></h1>
            <p className="aq-gate-sub">
              Sign in with your Google account to unlock your personal quest board, save your progress, and compete with friends.
            </p>
          </div>

          <div className="aq-gate-features">
            {[
              { icon: "🎮", title: "10+ Study Games", desc: "Flashcards, quizzes, Bingo, and more" },
              { icon: "📈", title: "Track Your Progress", desc: "XP, levels, streaks and achievements" },
              { icon: "☁️", title: "Synced Everywhere", desc: "Your progress saved to the cloud" },
            ].map((f) => (
              <div className="aq-gate-feature" key={f.title}>
                <span className="aq-gate-feature-icon">{f.icon}</span>
                <div>
                  <div className="aq-gate-feature-title">{f.title}</div>
                  <div className="aq-gate-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — sign in card */}
        <div className="aq-gate-right">
          <div className="aq-signin-card">
            <div className="aq-signin-card-top">
              <h2 className="aq-signin-title">Welcome back, Adventurer!</h2>
              <p className="aq-signin-sub">Sign in to continue your learning journey</p>
            </div>

            {error && (
              <div className="aq-signin-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {!customMode ? (
              <>
                {/* Main Google Sign-in button */}
                <button
                  className="aq-google-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  type="button"
                >
                  {isLoading ? (
                    <span className="aq-btn-spinner" />
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                  )}
                  <span>{isLoading ? "Connecting to Google…" : "Continue with Google"}</span>
                </button>

                <div className="aq-signin-divider">
                  <span>or</span>
                </div>

                <button
                  className="aq-alt-btn"
                  type="button"
                  onClick={() => setCustomMode(true)}
                >
                  Sign in with email address
                </button>
              </>
            ) : (
              <form onSubmit={handleCustomSignIn} className="aq-custom-form">
                <div className="aq-form-group">
                  <label className="aq-form-label">Google Email Address</label>
                  <input
                    type="email"
                    className="aq-form-input"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    required
                    autoFocus
                  />
                </div>
                <div className="aq-form-group">
                  <label className="aq-form-label">Display Name <span style={{ opacity: 0.5 }}>(optional)</span></label>
                  <input
                    type="text"
                    className="aq-form-input"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <button className="aq-google-btn" type="submit" disabled={isLoading}>
                  {isLoading ? <span className="aq-btn-spinner" /> : null}
                  <span>{isLoading ? "Signing in…" : "Sign In"}</span>
                </button>
                <button
                  type="button"
                  className="aq-alt-btn"
                  onClick={() => { setCustomMode(false); setError(null); }}
                  style={{ marginTop: "8px" }}
                >
                  ← Back to Google Sign-in
                </button>
              </form>
            )}

            <p className="aq-signin-terms">
              🔒 Protected by Google OAuth 2.0. By signing in, you agree to our Terms & Privacy Policy.
              <br />Your progress is saved and isolated per account.
            </p>

            {/* Stats bar */}
            <div className="aq-signin-stats">
              <div className="aq-signin-stat">
                <span className="aq-signin-stat-value">10+</span>
                <span className="aq-signin-stat-label">Games</span>
              </div>
              <div className="aq-signin-stat-divider" />
              <div className="aq-signin-stat">
                <span className="aq-signin-stat-value">100%</span>
                <span className="aq-signin-stat-label">Free</span>
              </div>
              <div className="aq-signin-stat-divider" />
              <div className="aq-signin-stat">
                <span className="aq-signin-stat-value">∞</span>
                <span className="aq-signin-stat-label">Topics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
