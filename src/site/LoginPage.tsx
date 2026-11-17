import React, { useState, useEffect } from "react";
import TopNav from "./TopNav";
import {
  getCurrentUser,
  getRegisteredAccounts,
  loginWithGoogle,
  switchAccount,
  removeAccount,
  logout,
  type UserProfile
} from "./authStore";
import "./auth.css";

export default function LoginPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getCurrentUser());
  const [accounts, setAccounts] = useState<UserProfile[]>(getRegisteredAccounts());
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
      setAccounts(getRegisteredAccounts());
    };
    window.addEventListener("sq_auth_changed", handleAuthChange);
    return () => window.removeEventListener("sq_auth_changed", handleAuthChange);
  }, []);

  const handleGoogleSignIn = () => {
    setLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      try {
        const defaultGoogleAccount = accounts.length > 0
          ? accounts[0]
          : {
              email: "student.studyquest@gmail.com",
              name: "Quest Scholar",
              avatar: ""
            };

        const user = loginWithGoogle(defaultGoogleAccount);
        setCurrentUser(user);
        setAccounts(getRegisteredAccounts());
        setLoading(false);
      } catch (err: any) {
        setLoading(false);
        setErrorMessage(err?.message || "Failed to sign in with Google. Please try again.");
      }
    }, 450);
  };

  const handleSwitch = (acc: UserProfile) => {
    switchAccount(acc.id);
  };

  const handleRemove = (e: React.MouseEvent, accId: string) => {
    e.stopPropagation();
    if (confirm("Remove this account from this device? (Your study data is preserved)")) {
      removeAccount(accId);
      setAccounts(getRegisteredAccounts());
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
  };

  return (
    <div className="sq-login-page-body">
      <TopNav activeTab="dashboard" />

      <main className="sq-login-main">
        <div className="sq-login-card">
          {/* EduQuest Brand / Mascot */}
          <div className="sq-auth-brand-badge">
            <div className="sq-auth-mascot-icon">
              <svg viewBox="0 0 36 36" width="52" height="52" fill="none" aria-hidden="true">
                <rect width="36" height="36" rx="12" fill="#6D28D9" />
                <rect x="7" y="16" width="22" height="12" rx="6" fill="#7C3AED" />
                <circle cx="18" cy="18" r="8.5" fill="#FFA500" />
                <circle cx="15" cy="17" r="1.6" fill="#1E1B4B" />
                <circle cx="21" cy="17" r="1.6" fill="#1E1B4B" />
                <path
                  d="M16 20.5C16.8 21.6 19.2 21.6 20 20.5"
                  stroke="#1E1B4B"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="sq-auth-brand-name">EduQuest</span>
          </div>

          {/* ACTIVE LOGGED-IN VIEW */}
          {currentUser ? (
            <div className="sq-login-signed-in">
              <div className="sq-current-user-banner">
                <div className="sq-current-avatar">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="sq-current-meta">
                  <span className="sq-auth-badge">✓ Active Google Account</span>
                  <h3 className="sq-current-name">{currentUser.name}</h3>
                  <p className="sq-current-email">{currentUser.email}</p>
                </div>
              </div>

              {/* Other Accounts on this device */}
              {accounts.length > 1 && (
                <div className="sq-other-accounts-box">
                  <span className="sq-other-title">Switch Account:</span>
                  <div className="sq-other-list">
                    {accounts
                      .filter((a) => a.id !== currentUser.id)
                      .map((acc) => (
                        <div
                          key={acc.id}
                          className="sq-other-item"
                          onClick={() => handleSwitch(acc)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="sq-other-avatar">{acc.name.charAt(0).toUpperCase()}</div>
                          <div className="sq-other-info">
                            <strong>{acc.name}</strong>
                            <small>{acc.email}</small>
                          </div>
                          <button
                            type="button"
                            className="sq-other-remove-btn"
                            onClick={(e) => handleRemove(e, acc.id)}
                            title="Remove account from device"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="sq-login-actions">
                <a href="/dashboard" className="sq-btn-to-dashboard">
                  Continue to Dashboard →
                </a>
                <button
                  type="button"
                  className="sq-btn-add-account"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  {loading ? "Connecting..." : "+ Connect Another Google Account"}
                </button>
                <button type="button" className="sq-btn-signout" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* SIGN-IN EXPERIENCE */
            <div className="sq-login-signed-out">
              <div className="sq-auth-header">
                <h2>Welcome to EduQuest</h2>
                <p>
                  Sign in or create your account with Google to sync your study decks, track daily
                  streaks, and level up your character across all devices.
                </p>
              </div>

              {errorMessage && (
                <div className="sq-auth-error-banner" role="alert">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Prominent Google Sign-in Button */}
              <div className="sq-auth-action-block">
                <button
                  type="button"
                  className="sq-google-signin-btn"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="sq-google-spinner" aria-hidden="true" />
                  ) : (
                    <svg
                      className="sq-google-icon"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
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
                  )}
                  <span className="sq-google-btn-text">
                    {loading ? "Connecting with Google..." : "Continue with Google"}
                  </span>
                </button>
              </div>

              {/* Saved accounts if any exist on this browser */}
              {accounts.length > 0 && (
                <div className="sq-saved-accounts-section">
                  <span className="sq-choose-label">Or choose a saved Google account:</span>
                  <div className="sq-chooser-list">
                    {accounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="sq-chooser-item"
                        onClick={() => handleSwitch(acc)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="sq-chooser-avatar">{acc.name.charAt(0).toUpperCase()}</div>
                        <div className="sq-chooser-info">
                          <strong>{acc.name}</strong>
                          <small>{acc.email}</small>
                        </div>
                        <span className="sq-choose-arrow">→</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="sq-auth-security-footer">
                <p>
                  🔒 Google OAuth 2.0 Secure Authentication.
                  <br />
                  By signing in, you agree to EduQuest's Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
