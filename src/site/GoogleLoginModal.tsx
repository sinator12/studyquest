import React, { useState } from "react";
import { loginWithGoogle, getRegisteredAccounts, switchAccount, type UserProfile } from "./authStore";
import "./auth.css";

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserProfile) => void;
}

export default function GoogleLoginModal({ isOpen, onClose, onSuccess }: GoogleLoginModalProps) {
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);

  const registeredAccounts = getRegisteredAccounts();

  if (!isOpen) return null;

  const handleSignIn = (email: string, name?: string) => {
    setIsLoading(true);
    setTimeout(() => {
      const user = loginWithGoogle({
        email,
        name
      });
      setIsLoading(false);
      onSuccess?.(user);
      onClose();
    }, 350);
  };

  const handleSelectExisting = (acc: UserProfile) => {
    switchAccount(acc.id);
    onSuccess?.(acc);
    onClose();
  };

  return (
    <div className="sq-auth-overlay" onClick={onClose}>
      <div className="sq-auth-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="sq-auth-close-btn" onClick={onClose} title="Close">
          ✕
        </button>

        <div className="sq-auth-header">
          {/* Official Google G Logo */}
          <div className="sq-google-logo-wrap">
            <svg width="40" height="40" viewBox="0 0 24 24">
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
          </div>
          <h2>Sign in with Google</h2>
          <p>Choose an account to continue to StudyQuest</p>
        </div>

        {/* Existing Accounts List (if any) */}
        {registeredAccounts.length > 0 && !showEmailInput && (
          <div className="sq-google-accounts-picker">
            <span className="sq-picker-label">Saved Google Accounts:</span>
            <div className="sq-picker-list">
              {registeredAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="sq-picker-item"
                  onClick={() => handleSelectExisting(acc)}
                >
                  <div className="sq-picker-avatar">{acc.name.charAt(0).toUpperCase()}</div>
                  <div className="sq-picker-info">
                    <strong>{acc.name}</strong>
                    <small>{acc.email}</small>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="sq-auth-another-btn"
              onClick={() => setShowEmailInput(true)}
            >
              + Use another Google account
            </button>
          </div>
        )}

        {/* Form to enter Google Account (When no accounts exist or user clicked 'Use another') */}
        {(registeredAccounts.length === 0 || showEmailInput) && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (googleEmail.trim()) {
                handleSignIn(googleEmail.trim(), googleName.trim() || undefined);
              }
            }}
            className="sq-google-auth-form"
          >
            <div className="sq-auth-field">
              <label htmlFor="modal-google-email">Google Email Address</label>
              <input
                id="modal-google-email"
                type="email"
                required
                autoFocus
                placeholder="youremail@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
              />
            </div>

            <div className="sq-auth-field">
              <label htmlFor="modal-google-name">Account Name (Optional)</label>
              <input
                id="modal-google-name"
                type="text"
                placeholder="e.g. Alex"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
              />
            </div>

            {/* Quick Demo Google Accounts for testing */}
            <div className="sq-quick-accounts-row">
              <span>Quick test accounts:</span>
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
                onClick={() => handleSignIn("sam.gamer@gmail.com", "Sam Quest")}
              >
                Sam (sam.gamer@gmail.com)
              </button>
            </div>

            <div className="sq-modal-form-actions">
              {registeredAccounts.length > 0 && (
                <button
                  type="button"
                  className="sq-btn-back-to-picker"
                  onClick={() => setShowEmailInput(false)}
                >
                  ← Back to accounts
                </button>
              )}
              <button type="submit" className="sq-google-submit-btn" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Continue with Google"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
