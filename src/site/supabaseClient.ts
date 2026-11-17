import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { type UserProfile, loginWithGoogle, switchAccount, logout } from "./authStore";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith("https://")
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Trigger Real Google OAuth 2.0 Sign In.
 * If Supabase credentials are configured, it redirects to official Google Sign-in.
 */
export async function signInWithGoogleOAuth(): Promise<{ error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      error:
        "Supabase credentials are not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env or Vercel Environment Variables.",
    };
  }

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      return { error: error.message };
    }
    return {};
  } catch (err: any) {
    return { error: err?.message || "Failed to initialize Google OAuth." };
  }
}

/**
 * Secure Sign Out
 */
export async function signOutOAuth(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  }
  logout();
}

/**
 * Initialize Supabase Auth Session listener.
 * Handles OAuth redirects, extracts user metadata (name, email, Google avatar),
 * and syncs their account profile.
 */
export function initSupabaseAuth(onUserLoaded?: (user: UserProfile) => void) {
  if (!supabase) return () => {};

  // Check current session on page load / revisit
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      handleSupabaseUser(session.user, onUserLoaded);
    }
  });

  // Listen for login, token refresh, logout
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user && (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED")) {
      handleSupabaseUser(session.user, onUserLoaded);
    } else if (event === "SIGNED_OUT") {
      logout();
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}

function handleSupabaseUser(user: User, onUserLoaded?: (user: UserProfile) => void) {
  const email = user.email || "";
  const meta = user.user_metadata || {};
  const name =
    meta.full_name ||
    meta.name ||
    (email ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Adventurer");
  const avatar = meta.avatar_url || meta.picture || "";

  const userProfile = loginWithGoogle({
    id: user.id, // Real persistent Supabase UUID
    email,
    name,
    avatar,
  });

  onUserLoaded?.(userProfile);
}
