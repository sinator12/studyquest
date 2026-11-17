import React, { useState } from "react";
import {
  loginWithGoogle,
  getRegisteredAccounts,
  switchAccount,
  getCurrentUser,
  type UserProfile
} from "./authStore";
import "./auth.css";

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserProfile) => void;
}

export default function GoogleLoginModal({ isOpen, onClose, onSuccess }: GoogleLoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSavedAccounts, setShowSavedAccounts] = useState(false);

  const registeredAccounts = getRegisteredAccounts();
  const currentUser = getCurrentUser();

  if (!isOpen) return null;

  // Prominent Google sign-in handler
  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setErrorMessage(null);

    // Simulate official Google OAuth sign-in flow
    setTimeout(() => {
      try {
        // If there's already a saved account that isn't logged in, continue with it,
        // or create standard Google account defaults as requested
        const defaultGoogleAccount = registeredAccounts.length > 0
          ? registeredAccounts[0]
          : {
              email: "student.studyquest@gmail.com",
              name: "Quest Scholar",
              avatar: ""
            };

        const user = loginWithGoogle(defaultGoogleAccount);
        setIsLoading(false);
        onSuccess?.(user);
        onClose();
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err?.message || "Failed to sign in with Google. Please try again.");
      }
    }, 450);
  };

  const handleSelectAccount = (acc: UserProfile) => {
    switchAccount(acc.id);
    onSuccess?.(acc);
    onClose();
  };

  return (
    <div className="sq-auth-overlay" onClick={onClose} role="presentation">
      <div
        className="sq-auth-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sq-login-title"
      >
        {/* Consistent Close Button */}
        <button
          type="button"
          className="sq-auth-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ✕
        </button>

        {/* 1. StudyQuest Branding */}
        <div className="sq-auth-brand-badge">
          <div className="sq-auth-mascot-icon">
            <svg viewBox="0 0 36 36" width="46" height="46" fill="none" aria-hidden="true">
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
          <span className="sq-auth-brand-label">StudyQuest</span>
        </div>

        {/* 2. Welcome Heading */}
        <div className="sq-auth-header">
          <h2 id="sq-login-title">Sign in to StudyQuest</h2>
          {/* 3. Short description explaining Google sign-in */}
          <p>
            Sign in or create your account with Google to sync your study decks, track daily
            streaks, and level up your character across all devices.
          </p>
        </div>

        {/* Error message if authentication failed */}
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

        {/* 4 & 5. Prominent Google Sign-in Button with Official 4-color Google Logo */}
        <div className="sq-auth-action-block">
          <button
            type="button"
            className="sq-google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            autoFocus
          >
            {isLoading ? (
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
              {isLoading ? "Connecting with Google..." : "Continue with Google"}
            </span>
          </button>
        </div>

        {/* 6. Subtle Alternative Navigation: Saved accounts drawer if available */}
        {registeredAccounts.length > 0 && (
          <div className="sq-saved-accounts-section">
            <button
              type="button"
              className="sq-saved-accounts-toggle"
              onClick={() => setShowSavedAccounts(!showSavedAccounts)}
              aria-expanded={showSavedAccounts}
            >
              <span>Saved Google accounts on this device ({registeredAccounts.length})</span>
              <span className="sq-toggle-chevron">{showSavedAccounts ? "▲" : "▼"}</span>
            </button>

            {showSavedAccounts && (
              <div className="sq-saved-accounts-dropdown">
                {registeredAccounts.map((acc) => {
                  const isActive = currentUser?.id === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      className={`sq-saved-acc-item ${isActive ? "active" : ""}`}
                      onClick={() => handleSelectAccount(acc)}
                    >
                      <div className="sq-saved-avatar">{acc.name.charAt(0).toUpperCase()}</div>
                      <div className="sq-saved-details">
                        <div className="sq-saved-name">
                          <span>{acc.name}</span>
                          {isActive && <span className="sq-saved-tag">Active</span>}
                        </div>
                        <span className="sq-saved-email">{acc.email}</span>
                      </div>
                      <span className="sq-saved-select-arrow">→</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Security & Terms note */}
        <div className="sq-auth-security-footer">
          <p>
            🔒 Google OAuth 2.0 Secure Authentication.
            <br />
            By signing in, you agree to StudyQuest's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
