import React, { useState } from "react";
import TopNav from "./TopNav";
import { getCurrentUser, loginWithGoogle, logout, type UserProfile } from "./authStore";
import "./auth.css";

export default function LoginPage() {
  const [currentUser, setUser] = useState<UserProfile | null>(getCurrentUser());
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = (email?: string, name?: string) => {
    setLoading(true);
    setTimeout(() => {
      const user = loginWithGoogle({
        email: email || "student@gmail.com",
        name
      });
      setUser(user);
      setLoading(false);
    }, 400);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <div className="sq-login-page-body">
      <TopNav activeTab="dashboard" />

      <main className="sq-login-main">
        <div className="sq-login-card">
          {/* Header mascot */}
          <div className="sq-login-mascot">
            <svg viewBox="0 0 36 36" width="48" height="48" fill="none">
              <rect width="36" height="36" rx="10" fill="#6D28D9" />
              <rect x="7" y="16" width="22" height="12" rx="6" fill="#7C3AED" />
              <circle cx="18" cy="18" r="8.5" fill="#FFA500" />
              <circle cx="15" cy="17" r="1.6" fill="#1E1B4B" />
              <circle cx="21" cy="17" r="1.6" fill="#1E1B4B" />
              <path d="M16 20.5C16.8 21.6 19.2 21.6 20 20.5" stroke="#1E1B4B" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>

          {currentUser ? (
            <div className="sq-login-signed-in">
              <span className="sq-auth-badge">✓ Google Account Connected</span>
              <h2>Welcome back, {currentUser.name}!</h2>
              <p className="sq-login-email-display">{currentUser.email}</p>

              <div className="sq-login-actions">
                <a href="/dashboard" className="sq-btn-to-dashboard">
                  Go to Dashboard →
                </a>
                <button type="button" className="sq-btn-signout" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="sq-login-form-wrap">
              <h2>Sign in to StudyQuest</h2>
              <p className="sq-login-subtitle">
                Access your personalized study plans, active reviewers, and study games.
              </p>

              {/* Continue with Google */}
              <button
                type="button"
                className="sq-google-signin-btn"
                onClick={() => handleGoogleLogin(emailInput || undefined, nameInput || undefined)}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{loading ? "Signing in..." : "Continue with Google"}</span>
              </button>

              <div className="sq-auth-custom-toggle">
                <button
                  type="button"
                  className="sq-auth-link-btn"
                  onClick={() => setShowCustom(!showCustom)}
                >
                  {showCustom ? "▲ Hide email options" : "▼ Enter your specific Gmail address"}
                </button>
              </div>

              {showCustom && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (emailInput.trim()) handleGoogleLogin(emailInput.trim(), nameInput.trim());
                  }}
                  className="sq-auth-form"
                >
                  <div className="sq-auth-field">
                    <label>Google Account Email</label>
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                  </div>

                  <div className="sq-auth-field">
                    <label>Display Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="sq-auth-submit-btn" disabled={loading}>
                    Sign in with this Google Email
                  </button>
                </form>
              )}

              <p className="sq-auth-disclaimer">
                Sign in with your Google account to save questions, plans, and game scores.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
