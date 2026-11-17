export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: "google";
  createdAt: string;
  lastLoginAt: string;
}

const ACCOUNTS_REGISTRY_KEY = "sq_accounts_registry";
const CURRENT_USER_ID_KEY = "sq_current_user_id";

/**
 * Retrieve all registered accounts on this browser
 */
export function getRegisteredAccounts(): UserProfile[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

/**
 * Save accounts registry to localStorage
 */
function saveRegisteredAccounts(accounts: UserProfile[]): void {
  try {
    localStorage.setItem(ACCOUNTS_REGISTRY_KEY, JSON.stringify(accounts));
  } catch (e) {}
}

/**
 * Get currently logged-in user, or null if logged out / no user selected
 */
export function getCurrentUser(): UserProfile | null {
  try {
    const activeId = localStorage.getItem(CURRENT_USER_ID_KEY);
    if (!activeId) return null;

    const accounts = getRegisteredAccounts();
    const found = accounts.find((a) => a.id === activeId);
    return found || null;
  } catch (e) {
    return null;
  }
}

/**
 * Log in / Sign up with a Google account
 * - If the account email already exists in registry, log into it and update lastLoginAt.
 * - If not, register it as a new distinct Google account with its own data partition.
 */
export function loginWithGoogle(profile: { id?: string; email: string; name?: string; avatar?: string }): UserProfile {
  const email = profile.email.trim().toLowerCase();
  const name =
    profile.name?.trim() ||
    email
      .split("@")[0]
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const accounts = getRegisteredAccounts();
  const existingIdx = accounts.findIndex((a) => a.email.toLowerCase() === email);

  let user: UserProfile;

  if (existingIdx >= 0) {
    // Existing account: update last login and profile
    user = {
      ...accounts[existingIdx],
      id: profile.id || accounts[existingIdx].id,
      name: name || accounts[existingIdx].name,
      avatar: profile.avatar || accounts[existingIdx].avatar,
      lastLoginAt: new Date().toISOString()
    };
    accounts[existingIdx] = user;
  } else {
    // New account registration
    user = {
      id: profile.id || ("usr_google_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36)),
      name,
      email,
      avatar: profile.avatar || "",
      provider: "google",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    accounts.push(user);
  }

  saveRegisteredAccounts(accounts);
  localStorage.setItem(CURRENT_USER_ID_KEY, user.id);
  window.dispatchEvent(new Event("sq_auth_changed"));
  return user;
}

/**
 * Switch active account to a different registered user
 */
export function switchAccount(userId: string): UserProfile | null {
  const accounts = getRegisteredAccounts();
  const target = accounts.find((a) => a.id === userId);
  if (target) {
    target.lastLoginAt = new Date().toISOString();
    saveRegisteredAccounts(accounts);
    localStorage.setItem(CURRENT_USER_ID_KEY, target.id);
    window.dispatchEvent(new Event("sq_auth_changed"));
    window.dispatchEvent(new Event("sq_deck_updated"));
    window.dispatchEvent(new Event("sq_stats_updated"));
    return target;
  }
  return null;
}

/**
 * Remove an account from the local registry
 */
export function removeAccount(userId: string): void {
  let accounts = getRegisteredAccounts();
  accounts = accounts.filter((a) => a.id !== userId);
  saveRegisteredAccounts(accounts);

  const currentId = localStorage.getItem(CURRENT_USER_ID_KEY);
  if (currentId === userId) {
    localStorage.removeItem(CURRENT_USER_ID_KEY);
  }
  window.dispatchEvent(new Event("sq_auth_changed"));
  window.dispatchEvent(new Event("sq_stats_updated"));
}

/**
 * Clean logout: clear active user ID without deleting accounts
 * Users will be presented with the account chooser / login interface
 */
export function logout(): void {
  try {
    localStorage.removeItem(CURRENT_USER_ID_KEY);
    window.dispatchEvent(new Event("sq_auth_changed"));
    window.dispatchEvent(new Event("sq_stats_updated"));
    window.dispatchEvent(new Event("sq_deck_updated"));
  } catch (e) {}
}
