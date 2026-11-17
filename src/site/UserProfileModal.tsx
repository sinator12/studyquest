import React, { useState, useEffect } from "react";
import { type UserProfile } from "./authStore";
import { signOutOAuth, isSupabaseConfigured } from "./supabaseClient";
import { getPlayerStats, getSavedDecks } from "./studyStore";
import { getCompletedFocusSessions } from "./focusStore";
import { pushProgressToCloud, getSyncState, type SyncState } from "./progressSync";
import "./auth.css";

interface UserProfileModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onOpenSwitcher: () => void;
}

export default function UserProfileModal({
  isOpen,
  user,
  onClose,
  onOpenSwitcher
}: UserProfileModalProps) {
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncingManual, setSyncingManual] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSyncState(getSyncState().state);

    const handleSyncStatus = (e: Event) => {
      const custom = e as CustomEvent<{ state: SyncState }>;
      if (custom.detail?.state) {
        setSyncState(custom.detail.state);
      }
    };

    window.addEventListener("sq_sync_status", handleSyncStatus);
    return () => window.removeEventListener("sq_sync_status", handleSyncStatus);
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const stats = getPlayerStats();
  const savedDecks = getSavedDecks();
  const focusSessions = getCompletedFocusSessions();

  const handleManualSync = async () => {
    setSyncingManual(true);
    setSyncSuccessMsg(null);
    const res = await pushProgressToCloud();
    setSyncingManual(false);
    if (res.success) {
      setSyncSuccessMsg("Progress saved and backed up successfully!");
      setTimeout(() => setSyncSuccessMsg(null), 3500);
    } else {
      setSyncSuccessMsg(res.error || "Failed to sync to cloud.");
    }
  };

  const handleSignOut = async () => {
    onClose();
    await signOutOAuth();
  };

  return (
    <div className="sq-auth-overlay" onClick={onClose} role="presentation">
      <div
        className="sq-auth-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sq-profile-title"
        style={{ maxWidth: "480px" }}
      >
        <button
          type="button"
          className="sq-auth-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ✕
        </button>

        {/* Profile Header */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              margin: "0 auto 12px auto",
              overflow: "hidden",
              background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 18px rgba(124, 58, 237, 0.45)",
              border: "3px solid rgba(255, 255, 255, 0.2)"
            }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: "28px", fontWeight: "800", color: "#FFFFFF" }}>
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h2 id="sq-profile-title" style={{ margin: "0 0 4px 0", fontSize: "1.3rem", color: "#F8FAFC" }}>
            {user.name}
          </h2>
          <span style={{ color: "#94A3B8", fontSize: "0.88rem" }}>{user.email}</span>
          <div style={{ marginTop: "6px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: "999px",
                fontSize: "0.72rem",
                fontWeight: 600,
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10B981",
                border: "1px solid rgba(16, 185, 129, 0.3)"
              }}
            >
              ✓ Authenticated Google User
            </span>
          </div>
        </div>

        {/* Isolated Progress Statistics */}
        <div
          style={{
            background: "#0F172A",
            borderRadius: "12px",
            padding: "14px",
            border: "1px solid #1E293B",
            marginBottom: "16px"
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
            Saved Account Progress
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", textAlign: "center" }}>
            <div style={{ background: "#1E293B", padding: "10px 6px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Level</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#818CF8" }}>Lv.{stats.level}</div>
            </div>
            <div style={{ background: "#1E293B", padding: "10px 6px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Streak</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#F59E0B" }}>🔥 {stats.streak}d</div>
            </div>
            <div style={{ background: "#1E293B", padding: "10px 6px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Total XP</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#10B981" }}>{stats.totalXp || stats.xp}</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "0.82rem", color: "#94A3B8", borderTop: "1px solid #1E293B", paddingTop: "10px" }}>
            <span>Saved Study Decks: <b style={{ color: "#F8FAFC" }}>{savedDecks.length}</b></span>
            <span>Focus Sessions: <b style={{ color: "#F8FAFC" }}>{focusSessions.length}</b></span>
          </div>
        </div>

        {/* Cloud Sync Status */}
        <div
          style={{
            background: "#0F172A",
            borderRadius: "12px",
            padding: "12px 14px",
            border: "1px solid #1E293B",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px"
          }}
        >
          <div>
            <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#F8FAFC" }}>
              Cloud Database Backup
            </div>
            <div style={{ fontSize: "0.76rem", color: "#64748B" }}>
              {isSupabaseConfigured
                ? "Connected to Supabase Cloud Database"
                : "Active user data securely isolated & persistent"}
            </div>
          </div>
          <button
            type="button"
            onClick={handleManualSync}
            disabled={syncingManual}
            style={{
              padding: "6px 12px",
              background: "#334155",
              color: "#F8FAFC",
              border: "1px solid #475569",
              borderRadius: "8px",
              fontSize: "0.78rem",
              cursor: "pointer",
              fontWeight: 600,
              whiteSpace: "nowrap"
            }}
          >
            {syncingManual ? "Saving..." : "Save Now"}
          </button>
        </div>

        {syncSuccessMsg && (
          <div
            style={{
              marginBottom: "14px",
              padding: "8px 12px",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#10B981",
              fontSize: "0.82rem",
              textAlign: "center"
            }}
          >
            {syncSuccessMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSwitcher();
            }}
            style={{
              width: "100%",
              padding: "10px",
              background: "#1E293B",
              color: "#E2E8F0",
              border: "1px solid #334155",
              borderRadius: "8px",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <span>🔄</span> Switch or Add Another Account
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            style={{
              width: "100%",
              padding: "10px",
              background: "rgba(239, 68, 68, 0.12)",
              color: "#F87171",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "8px",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
