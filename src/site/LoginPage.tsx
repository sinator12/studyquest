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
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(accounts.length === 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
      setAccounts(getRegisteredAccounts());
    };
    window.addEventListener("sq_auth_changed", handleAuthChange);
    return () => window.removeEventListener("sq_auth_changed", handleAuthChange);
  }, []);

  const handleSignIn = (email: string, name?: string) => {
    setLoading(true);
    setTimeout(() => {
      const user = loginWithGoogle({ email, name });
      setCurrentUser(user);
      setAccounts(getRegisteredAccounts());
      setLoading(false);
      setIsAddingNew(false);
    }, 300);
  };

  const handleSwitch = (acc: UserProfile) => {
    switchAccount(acc.id);
  };

  const handleRemove = (e: React.MouseEvent, accId: string) => {
    e.stopPropagation();
    if (confirm("Remove this account from this device? (Data is preserved)")) {
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
          {/* Header mascot */}
          <div className="sq-login-mascot">
            <svg viewBox="0 0 36 36" width="52" height="52" fill="none">
              <rect width="36" height="36" rx="10" fill="#6D28D9" />
              <rect x="7" y="16" width="22" height="12" rx="6" fill="#7C3AED" />
              <circle cx="18" cy="18" r="8.5" fill="#FFA500" />
              <circle cx="15" cy="17" r="1.6" fill="#1E1B4B" />
              <circle cx="21" cy="17" r="1.6" fill="#1E1B4B" />
              <path d="M16 20.5C16.8 21.6 19.2 21.6 20 20.5" stroke="#1E1B4B" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>

          <div className="sq-google-logo-row">
            <svg width="28" height="28" viewBox="0 0 24 24">
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
            <h2>StudyQuest Google Accounts</h2>
          </div>

          <p className="sq-login-subtitle">
            Sign in or sign up with your Google account to sync your study decks, levels, focus sessions, and streaks.
          </p>

          {/* ACTIVE LOGGED-IN VIEW */}
          {currentUser && !isAddingNew ? (
            <div className="sq-login-signed-in">
              <div className="sq-current-user-banner">
                <div className="sq-current-avatar">{currentUser.name.charAt(0).toUpperCase()}</div>
                <div>
                  <span className="sq-auth-badge">✓ Active Google Account</span>
                  <h3>{currentUser.name}</h3>
                  <p className="sq-login-email-display">{currentUser.email}</p>
                </div>
              </div>

              {/* Other Accounts on this device */}
              {accounts.length > 1 && (
                <div className="sq-other-accounts-box">
                  <span className="sq-other-title">Switch to another account:</span>
                  <div className="sq-other-list">
                    {accounts
                      .filter((a) => a.id !== currentUser.id)
                      .map((acc) => (
                        <div key={acc.id} className="sq-other-item" onClick={() => handleSwitch(acc)}>
                          <div className="sq-other-avatar">{acc.name.charAt(0).toUpperCase()}</div>
                          <div className="sq-other-info">
                            <strong>{acc.name}</strong>
                            <small>{acc.email}</small>
                          </div>
                          <button
                            type="button"
                            className="sq-other-remove-btn"
                            onClick={(e) => handleRemove(e, acc.id)}
                            title="Remove"
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
                  onClick={() => setIsAddingNew(true)}
                >
                  + Add Another Google Account
                </button>
                <button type="button" className="sq-btn-signout" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* ACCOUNT CHOOSER OR SIGN-IN FORM */
            <div className="sq-login-form-wrap">
              {accounts.length > 0 && !isAddingNew ? (
                /* List saved accounts */
                <div className="sq-accounts-chooser">
                  <span className="sq-choose-label">Select a saved Google account:</span>
                  <div className="sq-chooser-list">
                    {accounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="sq-chooser-item"
                        onClick={() => handleSwitch(acc)}
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

                  <button
                    type="button"
                    className="sq-btn-add-account"
                    onClick={() => setIsAddingNew(true)}
                  >
                    + Use another Google account
                  </button>
                </div>
              ) : (
                /* Sign-in / Sign-up with Google account */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (googleEmail.trim()) {
                      handleSignIn(googleEmail.trim(), googleName.trim() || undefined);
                    }
                  }}
                  className="sq-auth-form"
                >
                  <div className="sq-auth-field">
                    <label>Google Account Email</label>
                    <input
                      type="email"
                      required
                      placeholder="youremail@gmail.com"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                    />
                  </div>

                  <div className="sq-auth-field">
                    <label>Display Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex"
                      value={googleName}
                      onChange={(e) => setGoogleName(e.target.value)}
                    />
                  </div>

                  {/* Quick test accounts */}
                  <div className="sq-quick-accounts-row">
                    <span>Quick Google Accounts:</span>
                    <button
                      type="button"
                      className="sq-quick-acc-btn"
                      onClick={() => handleSignIn("alex.study@gmail.com", "Alex Student")}
                    >
                      Alex (alex.study@gmail.com)
                    </button>
                    <button
                      type="button"
                      className="sq-quick-acc-btn"
                      onClick={() => handleSignIn("sam.quest@gmail.com", "Sam Quest")}
                    >
                      Sam (sam.quest@gmail.com)
                    </button>
                  </div>

                  <div className="sq-form-buttons-row">
                    {accounts.length > 0 && (
                      <button
                        type="button"
                        className="sq-btn-cancel-add"
                        onClick={() => setIsAddingNew(false)}
                      >
                        ← Back to Saved Accounts
                      </button>
                    )}
                    <button type="submit" className="sq-auth-submit-btn" disabled={loading}>
                      {loading ? "Connecting..." : "Sign in / Register with Google"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
