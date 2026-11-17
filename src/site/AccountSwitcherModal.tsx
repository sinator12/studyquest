import React from "react";
import {
  getCurrentUser,
  getRegisteredAccounts,
  switchAccount,
  removeAccount,
  logout,
  type UserProfile
} from "./authStore";
import "./auth.css";

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGoogleLogin: () => void;
}

export default function AccountSwitcherModal({
  isOpen,
  onClose,
  onOpenGoogleLogin
}: AccountSwitcherModalProps) {
  if (!isOpen) return null;

  const currentUser = getCurrentUser();
  const accounts = getRegisteredAccounts();

  const handleSelectAccount = (acc: UserProfile) => {
    switchAccount(acc.id);
    onClose();
  };

  const handleRemove = (e: React.MouseEvent, accId: string) => {
    e.stopPropagation();
    if (confirm("Remove this account from this device? (Your study data is preserved)")) {
      removeAccount(accId);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="sq-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="sq-modal-card sq-switcher-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sq-switcher-title"
      >
        <button
          type="button"
          className="sq-auth-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ✕
        </button>

        <div className="sq-modal-head">
          <div className="sq-modal-title-row">
            <span className="sq-modal-icon">👤</span>
            <div>
              <h3 id="sq-switcher-title">Choose an Account</h3>
              <p>Switch between your Google study accounts or connect a new one.</p>
            </div>
          </div>
        </div>

        {/* Registered Accounts List */}
        <div className="sq-accounts-list">
          {accounts.map((acc) => {
            const isActive = currentUser?.id === acc.id;
            return (
              <div
                key={acc.id}
                className={`sq-account-card ${isActive ? "active" : ""}`}
                onClick={() => handleSelectAccount(acc)}
                role="button"
                tabIndex={0}
              >
                <div className="sq-acc-avatar">
                  <span>{acc.name.charAt(0).toUpperCase()}</span>
                </div>

                <div className="sq-acc-details">
                  <div className="sq-acc-name-row">
                    <strong>{acc.name}</strong>
                    {isActive && <span className="sq-active-badge">Active</span>}
                  </div>
                  <span className="sq-acc-email">{acc.email}</span>
                </div>

                <button
                  type="button"
                  className="sq-acc-remove-btn"
                  onClick={(e) => handleRemove(e, acc.id)}
                  title="Remove account from device"
                  aria-label={`Remove ${acc.name} from device`}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="sq-switcher-actions">
          <button
            type="button"
            className="sq-add-account-btn"
            onClick={() => {
              onClose();
              onOpenGoogleLogin();
            }}
          >
            <span>+</span>
            <span>Sign in with another Google account</span>
          </button>

          {currentUser && (
            <button type="button" className="sq-switcher-signout-btn" onClick={handleLogout}>
              Sign out of all accounts
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
