export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: "google" | "guest";
  signedInAt: string;
}

const AUTH_KEY = "sq_auth_user";

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export function setCurrentUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
    window.dispatchEvent(new Event("sq_auth_changed"));
  } catch (e) {}
}

export function loginWithGoogle(profile?: { name?: string; email?: string; avatar?: string }): UserProfile {
  const email = profile?.email || "student@gmail.com";
  const name = profile?.name || email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const initial = name.charAt(0).toUpperCase();

  const newUser: UserProfile = {
    id: "google-" + Date.now(),
    name,
    email,
    avatar: profile?.avatar || "",
    provider: "google",
    signedInAt: new Date().toISOString()
  };
  setCurrentUser(newUser);
  return newUser;
}

export function logout(): void {
  setCurrentUser(null);
}
