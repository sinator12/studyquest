import React, { useState, useEffect } from "react";
import TopNav from "./TopNav";
import {
  getCurrentUser,
  getRegisteredAccounts,
  loginWithGoogle,
  enterDemoMode,
  switchAccount,
  removeAccount,
  logout,
  type UserProfile
} from "./authStore";
import { signInWithGoogleOAuth, isSupabaseConfigured } from "./supabaseClient";
import "./auth.css";

export default function LoginPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getCurrentUser());
  const [accounts, setAccounts] = useState<UserProfile[]>(getRegisteredAccounts());
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
      setAccounts(getRegisteredAccounts());
    };
    window.addEventListener("sq_auth_changed", handleAuthChange);
    return () => window.removeEventListener("sq_auth_changed", handleAuthChange);
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);

    if (isSupabaseConfigured) {
      const { error } = await signInWithGoogleOAuth();
      if (error) {
        setLoading(false);
        setErrorMessage(error);
      }
      return;
    }

    setTimeout(() => {
      try {
        const defaultGoogleAccount =
          accounts.length > 0
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
    }, 360);
  };

  const handleCustomSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) {
      setErrorMessage("Please enter a valid Google email address.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const user = loginWithGoogle({
        email: customEmail.trim(),
        name: customName.trim() || undefined
      });
      setCurrentUser(user);
      setAccounts(getRegisteredAccounts());
      setCustomMode(false);
      setCustomEmail("");
      setCustomName("");
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || "Failed to sign in. Please try again.");
    }
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

  const handleDemoPreview = () => {
    enterDemoMode();
    window.location.assign("/dashboard");
  };

  return (
    <div className="sq-login-page-body">
      <TopNav activeTab="dashboard" />

      <main className="sq-login-main">
        <div className="sq-login-shell">
          {/* Context column */}
          <section className="sq-login-aside" aria-labelledby="sq-login-aside-heading">
            <div className="sq-auth-brand-badge">
              <div className="sq-auth-mascot-icon">
                <svg viewBox="0 0 36 36" width="42" height="42" fill="none" aria-hidden="true">
                  <rect width="36" height="36" rx="10" fill="#6D28D9" />
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

            <h1 id="sq-login-aside-heading" className="sq-login-aside-title">
              {currentUser ? "Your study profile is synced." : "Keep your study decks and streaks across sessions."}
            </h1>
            <p className="sq-login-aside-copy">
              {currentUser
                ? "Switch between accounts on this browser or jump back to your dashboard, plans, and games."
                : "Sign in with Google to unlock document uploads, 3-day exam plans, Full Card Bingo, and persistent XP."}
            </p>

            <ul className="sq-login-highlights">
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>Reads PDF, DOCX, PPTX, XLSX, and plain text</span>
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Isolated progress and decks per Google account</span>
              </li>
            </ul>
          </section>

          {/* Action card */}
          <section className="sq-login-card" aria-label={currentUser ? "Account session" : "Sign in"}>
            {currentUser ? (
              <div className="sq-login-signed-in">
                <div className="sq-current-user-banner">
                  <div className="sq-current-avatar">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="sq-current-meta">
                    <span className="sq-auth-badge">Active account</span>
                    <h2 className="sq-current-name">{currentUser.name}</h2>
                    <p className="sq-current-email">{currentUser.email}</p>
                  </div>
                </div>

                {accounts.length > 1 && (
                  <div className="sq-other-accounts-box">
                    <span className="sq-other-title">Switch account</span>
                    <div className="sq-other-list">
                      {accounts
                        .filter((a) => a.id !== currentUser.id)
                        .map((acc) => (
                          <div key={acc.id} className="sq-other-row">
                            <button
                              type="button"
                              className="sq-other-item"
                              onClick={() => handleSwitch(acc)}
                            >
                              <div className="sq-other-avatar">{acc.name.charAt(0).toUpperCase()}</div>
                              <div className="sq-other-info">
                                <strong>{acc.name}</strong>
                                <small>{acc.email}</small>
                              </div>
                            </button>
                            <button
                              type="button"
                              className="sq-other-remove-btn"
                              onClick={(e) => handleRemove(e, acc.id)}
                              aria-label={`Remove ${acc.name} from this device`}
                              title="Remove account from device"
                            >
                              ×
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
                    onClick={() => setCustomMode((prev) => !prev)}
                  >
                    {customMode ? "Cancel adding account" : "+ Connect another Google email"}
                  </button>

                  {customMode && (
                    <form onSubmit={handleCustomSignIn} className="sq-inline-email-form">
                      <div className="sq-form-field">
                        <label htmlFor="sq-login-add-email">Google email</label>
                        <input
                          id="sq-login-add-email"
                          type="email"
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                          placeholder="you@gmail.com"
                          autoComplete="email"
                          required
                          autoFocus
                        />
                      </div>
                      <div className="sq-form-field">
                        <label htmlFor="sq-login-add-name">
                          Display name <span>(optional)</span>
                        </label>
                        <input
                          id="sq-login-add-name"
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="Your name"
                          autoComplete="name"
                        />
                      </div>
                      <button type="submit" className="sq-primary-inline-btn" disabled={loading}>
                        {loading ? "Connecting…" : "Sign in and switch"}
                      </button>
                    </form>
                  )}

                  <button type="button" className="sq-btn-signout" onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="sq-login-signed-out">
                <div className="sq-auth-header">
                  <h2>Sign in</h2>
                  <p>Use Google to sync decks, study plans, and character XP.</p>
                </div>

                {errorMessage && (
                  <div className="sq-auth-error-banner" role="alert">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {!customMode ? (
                  <>
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
                            width="20"
                            height="20"
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
                          {loading ? "Connecting with Google…" : "Continue with Google"}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="sq-secondary-email-btn"
                        onClick={() => {
                          setErrorMessage(null);
                          setCustomMode(true);
                        }}
                      >
                        Use a different Google email
                      </button>
                    </div>

                    {accounts.length > 0 && (
                      <div className="sq-saved-accounts-section">
                        <span className="sq-choose-label">Saved on this device</span>
                        <div className="sq-chooser-list">
                          {accounts.map((acc) => (
                            <button
                              key={acc.id}
                              type="button"
                              className="sq-chooser-item"
                              onClick={() => handleSwitch(acc)}
                            >
                              <div className="sq-chooser-avatar">{acc.name.charAt(0).toUpperCase()}</div>
                              <div className="sq-chooser-info">
                                <strong>{acc.name}</strong>
                                <small>{acc.email}</small>
                              </div>
                              <span className="sq-choose-arrow" aria-hidden="true">→</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="sq-login-divider">
                      <span>or</span>
                    </div>

                    <button type="button" className="sq-login-demo-btn" onClick={handleDemoPreview}>
                      Preview in Demo Mode
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleCustomSignIn} className="sq-inline-email-form">
                    <div className="sq-form-field">
                      <label htmlFor="sq-login-email">Google email</label>
                      <input
                        id="sq-login-email"
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="you@gmail.com"
                        autoComplete="email"
                        required
                        autoFocus
                      />
                    </div>
                    <div className="sq-form-field">
                      <label htmlFor="sq-login-name">
                        Display name <span>(optional)</span>
                      </label>
                      <input
                        id="sq-login-name"
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Your name"
                        autoComplete="name"
                      />
                    </div>
                    <button type="submit" className="sq-primary-inline-btn" disabled={loading}>
                      {loading ? "Signing in…" : "Sign in"}
                    </button>
                    <button
                      type="button"
                      className="sq-secondary-email-btn"
                      onClick={() => {
                        setCustomMode(false);
                        setErrorMessage(null);
                      }}
                    >
                      Back to Google Sign-in
                    </button>
                  </form>
                )}

                <div className="sq-auth-security-footer">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <p>
                    Google OAuth 2.0 · Terms &amp; Privacy apply.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
