import { useState, useEffect } from "react";
import {
  getCurrentUser,
  isDemoMode,
  enterDemoMode,
  loginWithGoogle,
  type UserProfile
} from "./authStore";
import { signInWithGoogleOAuth, isSupabaseConfigured } from "./supabaseClient";
import "./AuthGate.css";

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<UserProfile | null>(getCurrentUser());
  const [demoActive, setDemoActive] = useState<boolean>(isDemoMode());
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(getCurrentUser());
      setDemoActive(isDemoMode());
    };
    window.addEventListener("sq_auth_changed", handleAuthChange);

    const timer = setTimeout(() => {
      setUser(getCurrentUser());
      setDemoActive(isDemoMode());
      setIsCheckingSession(false);
    }, 280);

    return () => {
      window.removeEventListener("sq_auth_changed", handleAuthChange);
      clearTimeout(timer);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    if (isSupabaseConfigured) {
      const { error: oauthError } = await signInWithGoogleOAuth();
      if (oauthError) {
        setIsLoading(false);
        setError(oauthError);
      }
      return;
    }

    setTimeout(() => {
      try {
        const newUser = loginWithGoogle({
          email: "scholar@gmail.com",
          name: "Quest Scholar",
          avatar: ""
        });
        setUser(newUser);
        setDemoActive(false);
        setIsLoading(false);
      } catch (e: any) {
        setError(e?.message || "Sign in failed. Please try again.");
        setIsLoading(false);
      }
    }, 320);
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
      setDemoActive(false);
      setIsLoading(false);
    } catch (e: any) {
      setError(e?.message || "Sign in failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleEnterDemo = () => {
    enterDemoMode();
    setDemoActive(true);
  };

  if (isCheckingSession) {
    return (
      <div className="aq-gate-loading" role="status" aria-label="Loading EduQuest">
        <div className="aq-gate-loading-logo">
          <svg viewBox="0 0 48 48" width="44" height="44" fill="none" aria-hidden="true">
            <rect width="48" height="48" rx="13" fill="#6D28D9" />
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

  if (user || demoActive) {
    return <>{children}</>;
  }

  return (
    <div className="aq-gate">
      <main className="aq-gate-content">
        {/* Left column: clear product context without decorative cards or gradients */}
        <section className="aq-gate-left" aria-labelledby="aq-gate-heading">
          <div className="aq-gate-brand">
            <div className="aq-gate-logo-wrap">
              <svg viewBox="0 0 48 48" width="44" height="44" fill="none" aria-hidden="true">
                <rect width="48" height="48" rx="13" fill="#6D28D9" />
                <rect x="9" y="22" width="30" height="16" rx="8" fill="#7C3AED" />
                <circle cx="24" cy="24" r="11" fill="#FFA500" />
                <circle cx="20" cy="22.5" r="2.1" fill="#1E1B4B" />
                <circle cx="28" cy="22.5" r="2.1" fill="#1E1B4B" />
                <path d="M21 27C21.8 28.2 26.2 28.2 27 27" stroke="#1E1B4B" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <span className="aq-gate-brand-name">EduQuest</span>
          </div>

          <div className="aq-gate-headline">
            <h1 id="aq-gate-heading">
              Turn your study notes into active recall.
            </h1>
            <p className="aq-gate-sub">
              Upload PDFs, slides, or notes to build concept breakdowns, 3-day exam plans, and playable study rounds.
            </p>
          </div>

          <ul className="aq-gate-capabilities">
            <li className="aq-gate-cap-item">
              <span className="aq-cap-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="13" y2="17" />
                </svg>
              </span>
              <div>
                <strong>Document-grounded AI</strong>
                <span>Reads inside PDF, DOCX, PPTX, XLSX, and plain text.</span>
              </div>
            </li>
            <li className="aq-gate-cap-item">
              <span className="aq-cap-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="3" />
                  <line x1="6" y1="12" x2="10" y2="12" />
                  <line x1="8" y1="10" x2="8" y2="14" />
                  <circle cx="15.5" cy="12" r="0.8" fill="currentColor" />
                  <circle cx="18" cy="12" r="0.8" fill="currentColor" />
                </svg>
              </span>
              <div>
                <strong>Study Café &amp; Bingo Night</strong>
                <span>Practice your own decks in fast, non-repeating quiz rounds.</span>
              </div>
            </li>
            <li className="aq-gate-cap-item">
              <span className="aq-cap-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </span>
              <div>
                <strong>Saved decks &amp; streaks</strong>
                <span>Keep your XP, study plans, and deck library synced per account.</span>
              </div>
            </li>
          </ul>
        </section>

        {/* Right column: focused sign-in panel */}
        <section className="aq-gate-right" aria-label="Sign in">
          <div className="aq-signin-card">
            <div className="aq-signin-card-top">
              <h2 className="aq-signin-title">Sign in to EduQuest</h2>
              <p className="aq-signin-sub">Continue with Google to save decks, streaks, and levels.</p>
            </div>

            {error && (
              <div className="aq-signin-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {!customMode ? (
              <>
                <button
                  className="aq-google-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  type="button"
                >
                  {isLoading ? (
                    <span className="aq-btn-spinner" aria-hidden="true" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                  )}
                  <span>{isLoading ? "Connecting to Google…" : "Continue with Google"}</span>
                </button>

                <button
                  className="aq-alt-btn"
                  type="button"
                  onClick={() => {
                    setError(null);
                    setCustomMode(true);
                  }}
                >
                  Use a different Google email
                </button>

                <div className="aq-signin-divider">
                  <span>or</span>
                </div>

                <button
                  className="aq-demo-btn"
                  type="button"
                  onClick={handleEnterDemo}
                >
                  Preview in Demo Mode
                </button>
                <p className="aq-demo-note">
                  Includes Study Café (5 Qs), Line Bingo, and 2 AI topic previews without saving progress.
                </p>
              </>
            ) : (
              <form onSubmit={handleCustomSignIn} className="aq-custom-form">
                <div className="aq-form-group">
                  <label className="aq-form-label" htmlFor="aq-email-input">Google email</label>
                  <input
                    id="aq-email-input"
                    type="email"
                    className="aq-form-input"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    autoComplete="email"
                    required
                    autoFocus
                  />
                </div>
                <div className="aq-form-group">
                  <label className="aq-form-label" htmlFor="aq-name-input">
                    Display name <span className="aq-optional-label">(optional)</span>
                  </label>
                  <input
                    id="aq-name-input"
                    type="text"
                    className="aq-form-input"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </div>
                <button className="aq-primary-submit-btn" type="submit" disabled={isLoading}>
                  {isLoading && <span className="aq-btn-spinner aq-btn-spinner-light" aria-hidden="true" />}
                  <span>{isLoading ? "Signing in…" : "Sign in"}</span>
                </button>
                <button
                  type="button"
                  className="aq-alt-btn"
                  onClick={() => {
                    setCustomMode(false);
                    setError(null);
                  }}
                >
                  Back to Google Sign-in
                </button>
              </form>
            )}

            <div className="aq-signin-terms">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Google OAuth 2.0 · Progress is stored separately per account.</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
