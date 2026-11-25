import { type Question } from "./quizData";
import { getCurrentUser, isDemoMode } from "./authStore";

export interface DeckInfo {
  id: string;
  title: string;
  sourceType: "file" | "text" | "topic" | "sample";
  fileName?: string;
  contentPreview?: string;
  questionCount: number;
  createdAt: number | string;
  questions: Question[];
}

export interface AIProviderConfig {
  provider: "nvidia" | "groq" | "builtin" | "gemini" | "openai";
  nvidiaKey: string;
  groqKey: string;
  geminiKey: string;
  openaiKey: string;
  model: string;
}

export interface XpEvent {
  id: string;
  reason: string;
  xp: number;
  timestamp: number;
}

export interface PlayerStats {
  level: number;
  xp: number;
  nextLevelXp: number; // XP threshold for next level (e.g. level * 100)
  totalXp: number;
  streak: number;
  lastActiveDate: string; // "YYYY-MM-DD"
  longestStreak: number;
  coins: number;
  stars: number;
  recentXpEvents: XpEvent[];
}

/**
 * Scope keys per authenticated user account
 */
function getUserKey(baseKey: string): string {
  const user = getCurrentUser();
  const userId = user ? user.id : "guest";
  return `sq_${userId}_${baseKey}`;
}

// Default sample questions for Demo Deck
const DEFAULT_DEMO_QUESTIONS: Question[] = [
  {
    id: 101,
    subject: "science",
    question: "What force keeps planets in orbit around the Sun?",
    options: ["Gravity", "Magnetism", "Friction", "Electromagnetism"],
    correctIndex: 0,
    explanation: "Gravity is the attractive force that keeps planets orbiting celestial bodies."
  },
  {
    id: 102,
    subject: "math",
    question: "What is the square root of 144?",
    options: ["12", "10", "14", "16"],
    correctIndex: 0,
    explanation: "12 × 12 = 144."
  },
  {
    id: 103,
    subject: "geography",
    question: "In which country are the pyramids of Giza located?",
    options: ["Egypt", "Greece", "Mexico", "Peru"],
    correctIndex: 0,
    explanation: "The Great Pyramids of Giza are located on the Giza plateau near Cairo, Egypt."
  },
  {
    id: 104,
    subject: "general",
    question: "Which musical instrument has keys, pedals, and strings?",
    options: ["Piano", "Flute", "Trumpet", "Violin"],
    correctIndex: 0,
    explanation: "A piano uses keys that trigger hammers to strike strings, and foot pedals."
  },
  {
    id: 105,
    subject: "science",
    question: "What is the chemical symbol for water?",
    options: ["H2O", "CO2", "NaCl", "O2"],
    correctIndex: 0,
    explanation: "Water consists of two hydrogen atoms bonded to one oxygen atom (H2O)."
  },
  {
    id: 106,
    subject: "science",
    question: "Which planet is known as the Red Planet?",
    options: ["Mars", "Venus", "Jupiter", "Saturn"],
    correctIndex: 0,
    explanation: "Mars appears red because of iron oxide on its surface."
  }
];

export function getActiveDeck(): DeckInfo {
  try {
    const raw = localStorage.getItem(getUserKey("active_deck"));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  return {
    id: "demo-deck",
    title: "Demo Deck: Science & Trivia",
    sourceType: "sample",
    questionCount: DEFAULT_DEMO_QUESTIONS.length,
    createdAt: Date.now(),
    questions: DEFAULT_DEMO_QUESTIONS
  };
}

export function setActiveDeck(deck: DeckInfo): void {
  try {
    localStorage.setItem(getUserKey("active_deck"), JSON.stringify(deck));
    if (!isDemoMode()) {
      const saved = getSavedDecks().filter((d) => d.id !== deck.id);
      saved.unshift(deck);
      localStorage.setItem(getUserKey("saved_decks"), JSON.stringify(saved.slice(0, 10)));
    }
    window.dispatchEvent(new Event("sq_deck_updated"));
  } catch (e) {
    console.error("Failed to save active deck", e);
  }
}

export function getSavedDecks(): DeckInfo[] {
  if (isDemoMode()) return [];
  try {
    const raw = localStorage.getItem(getUserKey("saved_decks"));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export const DEFAULT_NVIDIA_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_NVIDIA_API_KEY) || "";

export const DEFAULT_GROQ_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GROQ_API_KEY) || "";

export function getAIConfig(): AIProviderConfig {
  try {
    const raw = localStorage.getItem(getUserKey("ai_config"));
    if (raw) {
      const parsed = JSON.parse(raw);
      const isLegacyConfig = typeof parsed.nvidiaKey === "undefined";
      if (!parsed.nvidiaKey) {
        parsed.nvidiaKey = DEFAULT_NVIDIA_KEY;
      }
      if (!parsed.groqKey) {
        parsed.groqKey = DEFAULT_GROQ_KEY;
      }
      // Migrate pre-NVIDIA saved configs so NVIDIA becomes the main provider
      if (isLegacyConfig && (!parsed.provider || parsed.provider === "groq")) {
        parsed.provider = DEFAULT_NVIDIA_KEY ? "nvidia" : "groq";
      }
      if (!parsed.provider) {
        parsed.provider = DEFAULT_NVIDIA_KEY ? "nvidia" : "groq";
      }
      return parsed;
    }
  } catch (e) {}
  return {
    provider: DEFAULT_NVIDIA_KEY ? "nvidia" : "groq",
    nvidiaKey: DEFAULT_NVIDIA_KEY,
    groqKey: DEFAULT_GROQ_KEY,
    geminiKey: "",
    openaiKey: "",
    model: "nvidia/nemotron-3.5-lightning-30b-a3b"
  };
}

export function setAIConfig(config: AIProviderConfig): void {
  try {
    localStorage.setItem(getUserKey("ai_config"), JSON.stringify(config));
    window.dispatchEvent(new Event("sq_aiconfig_updated"));
  } catch (e) {}
}

/**
 * Calculates XP threshold required for a given level
 * Level 1 requires 100 XP to reach Level 2.
 * Level 2 requires 200 XP to reach Level 3.
 * Level N requires N * 100 XP.
 */
export function getRequiredXpForLevel(level: number): number {
  return Math.max(100, level * 100);
}

/**
 * Retrieve user player stats with level, XP progress, and streaks
 */
export function getPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(getUserKey("player_stats"));
    if (raw) {
      const stats = JSON.parse(raw);
      if (stats && typeof stats.level === "number") {
        if (!stats.nextLevelXp) stats.nextLevelXp = getRequiredXpForLevel(stats.level);
        if (!stats.recentXpEvents) stats.recentXpEvents = [];
        return stats;
      }
    }
  } catch (e) {}

  const defaultStats: PlayerStats = {
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    totalXp: 0,
    streak: 1,
    lastActiveDate: new Date().toISOString().split("T")[0],
    longestStreak: 1,
    coins: 100,
    stars: 3,
    recentXpEvents: [
      { id: "init_1", reason: "Account Welcome Bonus", xp: 40, timestamp: Date.now() - 3600000 }
    ]
  };
  return defaultStats;
}

/**
 * Save player stats to active user storage
 */
function savePlayerStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(getUserKey("player_stats"), JSON.stringify(stats));
    window.dispatchEvent(new Event("sq_stats_updated"));
  } catch (e) {}
}

/**
 * Add experience points (XP) to the current user with automatic Level-Up calculation!
 */
export function addXp(amount: number, reason: string): { newLevel: number; leveledUp: boolean; stats: PlayerStats } {
  if (amount <= 0 || isDemoMode()) return { newLevel: 1, leveledUp: false, stats: getPlayerStats() };

  const current = getPlayerStats();
  let level = current.level;
  let xp = current.xp + amount;
  let totalXp = (current.totalXp || 0) + amount;
  let nextLevelXp = current.nextLevelXp || getRequiredXpForLevel(level);
  let leveledUp = false;

  // Handle multi-level progression if large XP gained
  while (xp >= nextLevelXp) {
    xp -= nextLevelXp;
    level += 1;
    nextLevelXp = getRequiredXpForLevel(level);
    leveledUp = true;
    current.coins += 50; // Level-up bonus coins
    current.stars += 2;  // Level-up bonus stars
  }

  // Record event in recent history
  const recentXpEvents = [
    {
      id: "xp_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 5),
      reason,
      xp: amount,
      timestamp: Date.now()
    },
    ...(current.recentXpEvents || [])
  ].slice(0, 20);

  const updated: PlayerStats = {
    ...current,
    level,
    xp,
    nextLevelXp,
    totalXp,
    recentXpEvents
  };

  savePlayerStats(updated);

  if (leveledUp) {
    window.dispatchEvent(
      new CustomEvent("sq_level_up", {
        detail: { newLevel: level, bonusCoins: 50, bonusStars: 2 }
      })
    );
  }

  return { newLevel: level, leveledUp, stats: updated };
}

/**
 * Record daily learning activity (games, quizzes, focus timer) with calendar-day streak tracking
 */
export function recordActivityToday(reason: string, xpReward: number = 25): PlayerStats {
  if (isDemoMode()) return getPlayerStats();
  const current = getPlayerStats();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let streak = current.streak || 1;
  const lastActive = current.lastActiveDate;

  if (!lastActive) {
    streak = 1;
  } else if (lastActive === todayStr) {
    // Already active today, streak maintained
  } else if (lastActive === yesterdayStr) {
    // Consecutive day activity!
    streak += 1;
  } else {
    // Missed one or more days, reset streak to 1
    streak = 1;
  }

  const longestStreak = Math.max(streak, current.longestStreak || 1);

  // Update stats
  current.streak = streak;
  current.longestStreak = longestStreak;
  current.lastActiveDate = todayStr;
  savePlayerStats(current);

  // Award XP for the activity
  if (xpReward > 0) {
    addXp(xpReward, reason);
  }

  return getPlayerStats();
}

/**
 * Update stats delta (coins, stars, etc.)
 */
export function updatePlayerStats(delta: Partial<PlayerStats>): PlayerStats {
  if (isDemoMode()) return getPlayerStats();
  const current = getPlayerStats();
  const updated: PlayerStats = {
    ...current,
    coins: current.coins + (delta.coins ?? 0),
    stars: current.stars + (delta.stars ?? 0)
  };
  if (delta.xp && delta.xp > 0) {
    return addXp(delta.xp, "Bonus XP").stats;
  }
  savePlayerStats(updated);
  return updated;
}
