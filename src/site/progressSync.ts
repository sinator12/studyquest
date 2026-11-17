import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { getCurrentUser } from "./authStore";
import { getPlayerStats, getSavedDecks, getActiveDeck, type PlayerStats, type DeckInfo } from "./studyStore";
import { getCompletedFocusSessions, type FocusSession } from "./focusStore";

export interface UserCloudProgress {
  user_id: string;
  stats: PlayerStats;
  saved_decks: DeckInfo[];
  active_deck_id?: string;
  focus_sessions: FocusSession[];
  updated_at: string;
}

export type SyncState = "idle" | "syncing" | "synced" | "error";

let currentSyncState: SyncState = "idle";
let lastSyncedTime: number | null = null;
let syncTimeout: any = null;

export function getSyncState(): { state: SyncState; lastSyncedTime: number | null } {
  return { state: currentSyncState, lastSyncedTime };
}

function setSyncState(state: SyncState) {
  currentSyncState = state;
  if (state === "synced") {
    lastSyncedTime = Date.now();
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("sq_sync_status", {
        detail: { state: currentSyncState, lastSyncedTime }
      })
    );
  }
}

/**
 * Debounced push of all current user progress to Supabase database.
 * Called automatically whenever XP is gained, a game is completed, a deck is created, etc.
 */
export function scheduleCloudSync(delayMs = 1500): void {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    pushProgressToCloud();
  }, delayMs);
}

/**
 * Immediately push current user's progress to Supabase database.
 */
export async function pushProgressToCloud(): Promise<{ success: boolean; error?: string }> {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "No authenticated user" };

  if (!supabase || !isSupabaseConfigured) {
    // If Supabase is not configured yet, data is already persisted in isolated local storage partition
    setSyncState("synced");
    return { success: true };
  }

  setSyncState("syncing");

  try {
    const stats = getPlayerStats();
    const savedDecks = getSavedDecks();
    const activeDeck = getActiveDeck();
    const focusSessions = getCompletedFocusSessions();

    // 1. Sync User Profile in database
    try {
      await supabase.from("user_profiles").upsert(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar || "",
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );
    } catch (e) {
      // non-fatal if table doesn't exist yet
    }

    // 2. Sync Progress payload in database
    const payload: UserCloudProgress = {
      user_id: user.id,
      stats,
      saved_decks: savedDecks,
      active_deck_id: activeDeck?.id,
      focus_sessions: focusSessions,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("user_progress").upsert(payload, { onConflict: "user_id" });

    if (error) {
      console.warn("Supabase progress sync error:", error.message);
      setSyncState("error");
      return { success: false, error: error.message };
    }

    setSyncState("synced");
    return { success: true };
  } catch (err: any) {
    console.warn("Failed to push progress to Supabase:", err);
    setSyncState("error");
    return { success: false, error: err?.message };
  }
}

/**
 * Restore user's progress from Supabase database upon login or session start.
 * Restores game stats, levels, coins, streaks, decks, and focus sessions.
 */
export async function restoreProgressFromCloud(userId: string): Promise<boolean> {
  if (!userId) return false;
  if (!supabase || !isSupabaseConfigured) return false;

  setSyncState("syncing");

  try {
    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      // User has no previous cloud progress yet
      setSyncState("idle");
      return false;
    }

    const cloudData = data as UserCloudProgress;

    // Restore player stats
    if (cloudData.stats) {
      localStorage.setItem(`sq_${userId}_player_stats`, JSON.stringify(cloudData.stats));
      window.dispatchEvent(new Event("sq_stats_updated"));
    }

    // Restore saved decks
    if (Array.isArray(cloudData.saved_decks)) {
      localStorage.setItem(`sq_${userId}_saved_decks`, JSON.stringify(cloudData.saved_decks));
      if (cloudData.active_deck_id) {
        const found = cloudData.saved_decks.find((d) => d.id === cloudData.active_deck_id);
        if (found) {
          localStorage.setItem(`sq_${userId}_active_deck`, JSON.stringify(found));
        }
      }
      window.dispatchEvent(new Event("sq_deck_updated"));
    }

    // Restore focus sessions
    if (Array.isArray(cloudData.focus_sessions)) {
      localStorage.setItem(`sq_${userId}_focus_sessions`, JSON.stringify(cloudData.focus_sessions));
      window.dispatchEvent(new Event("sq_focus_updated"));
    }

    setSyncState("synced");
    return true;
  } catch (e) {
    console.warn("Could not fetch remote progress:", e);
    setSyncState("error");
    return false;
  }
}

// Automatic event listeners to trigger cloud sync seamlessly whenever progress occurs!
if (typeof window !== "undefined") {
  let isRestoring = false;
  window.addEventListener("sq_stats_updated", () => {
    if (!isRestoring) scheduleCloudSync();
  });
  window.addEventListener("sq_deck_updated", () => {
    if (!isRestoring) scheduleCloudSync();
  });
  window.addEventListener("sq_focus_updated", () => {
    if (!isRestoring) scheduleCloudSync();
  });
}
