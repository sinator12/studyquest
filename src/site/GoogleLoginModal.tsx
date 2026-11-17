import React, { useState } from "react";
import { loginWithGoogle, type UserProfile } from "./authStore";
import "./auth.css";

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserProfile) => void;
}

export default function GoogleLoginModal({ isOpen, onClose, onSuccess }: GoogleLoginModalProps) {
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleInstantGoogleSignIn = () => {
    setIsLoading(true);
    setTimeout(() => {
      const user = loginWithGoogle({
        email: customEmail.trim() || "student@gmail.com",
        name: customName.trim() || undefined
      });
      setIsLoading(false);
      onSuccess?.(user);
      onClose();
    }, 400);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    handleInstantGoogleSignIn();
  };

  return (
    <div className="sq-auth-overlay" onClick={onClose}>
      <div className="sq-auth-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="sq-auth-close-btn" onClick={onClose} title="Close">
          ✕
        </button>

        <div className="sq-auth-header">
          {/* StudyQuest mascot badge */}
          <div className="sq-auth-mascot-badge">
            <svg viewBox="0 0 36 36" width="38" height="38" fill="none">
              <rect width="36" height="36" rx="10" fill="#6D28D9" />
              <rect x="7" y="16" width="22" height="12" rx="6" fill="#7C3AED" />
              <circle cx="18" cy="18" r="8.5" fill="#FFA500" />
              <circle cx="15" cy="17" r="1.6" fill="#1E1B4B" />
              <circle cx="21" cy="17" r="1.6" fill="#1E1B4B" />
              <path d="M16 20.5C16.8 21.6 19.2 21.6 20 20.5" stroke="#1E1B4B" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <h2>Sign in to StudyQuest</h2>
          <p>Sync your study notes, personalized plans, and game progress across all your devices.</p>
        </div>

        <div className="sq-auth-content">
          {/* Main Google Sign-In Button */}
          <button
            type="button"
            className="sq-google-signin-btn"
            onClick={handleInstantGoogleSignIn}
            disabled={isLoading}
          >
            {/* 4-Color Official Google G Icon */}
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
            <span>{isLoading ? "Signing in..." : "Continue with Google"}</span>
          </button>

          {/* Option to specify custom Google Email */}
          <div className="sq-auth-custom-toggle">
            <button
              type="button"
              className="sq-auth-link-btn"
              onClick={() => setShowCustomForm(!showCustomForm)}
            >
              {showCustomForm ? "▲ Hide email options" : "▼ Enter your specific Gmail address"}
            </button>
          </div>

          {showCustomForm && (
            <form onSubmit={handleCustomSubmit} className="sq-auth-form">
              <div className="sq-auth-field">
                <label>Google Account Email</label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                />
              </div>

              <div className="sq-auth-field">
                <label>Display Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>

              <button type="submit" className="sq-auth-submit-btn" disabled={isLoading}>
                {isLoading ? "Connecting..." : "Sign in with this Google Email"}
              </button>
            </form>
          )}

          {/* Privacy & Terms footer */}
          <div className="sq-auth-footer-note">
            <span>By continuing, you sign in to StudyQuest using Google authentication.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
