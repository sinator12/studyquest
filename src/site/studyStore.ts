import { type Question } from "./quizData";

export interface DeckInfo {
  id: string;
  title: string;
  sourceType: "file" | "text" | "topic" | "sample";
  fileName?: string;
  questionCount: number;
  createdAt: number;
  questions: Question[];
}

export interface AIProviderConfig {
  provider: "builtin" | "gemini" | "openai";
  geminiKey: string;
  openaiKey: string;
  model: string;
}

export interface PlayerStats {
  level: number;
  xp: number;
  streak: number;
  coins: number;
  stars: number;
}

const DECK_KEY = "sq_active_deck";
const SAVED_DECKS_KEY = "sq_saved_decks";
const AI_CONFIG_KEY = "sq_ai_config";
const STATS_KEY = "sq_player_stats";

// Default sample questions about general science and history for Demo Deck
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
    explanation: "A piano uses keys that trigger felt-covered hammers to strike strings, and foot pedals to alter the sound."
  },
  {
    id: 105,
    subject: "general",
    question: "Which of these instruments is played by blowing air?",
    options: ["Flute", "Drum", "Violin", "Guitar"],
    correctIndex: 0,
    explanation: "The flute is a woodwind instrument played by directing a stream of air against the edge of a hole."
  },
  {
    id: 106,
    subject: "science",
    question: "What is the chemical symbol for water?",
    options: ["H2O", "CO2", "NaCl", "O2"],
    correctIndex: 0,
    explanation: "Water consists of two hydrogen atoms bonded to one oxygen atom (H2O)."
  },
  {
    id: 107,
    subject: "science",
    question: "Which planet is known as the Red Planet?",
    options: ["Mars", "Venus", "Jupiter", "Saturn"],
    correctIndex: 0,
    explanation: "Mars appears red because of iron oxide (rust) on its surface."
  },
  {
    id: 108,
    subject: "math",
    question: "Which of these numbers is a prime number?",
    options: ["17", "9", "15", "21"],
    correctIndex: 0,
    explanation: "17 has only two distinct positive divisors: 1 and itself."
  }
];

export function getActiveDeck(): DeckInfo {
  try {
    const raw = localStorage.getItem(DECK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to read active deck from localStorage", e);
  }

  // Fallback demo deck
  const defaultDeck: DeckInfo = {
    id: "demo-deck",
    title: "Demo Deck: Science & Trivia",
    sourceType: "sample",
    questionCount: DEFAULT_DEMO_QUESTIONS.length,
    createdAt: Date.now(),
    questions: DEFAULT_DEMO_QUESTIONS
  };
  return defaultDeck;
}

export function setActiveDeck(deck: DeckInfo): void {
  try {
    localStorage.setItem(DECK_KEY, JSON.stringify(deck));
    // Also save to saved decks library
    const saved = getSavedDecks().filter(d => d.id !== deck.id);
    saved.unshift(deck);
    localStorage.setItem(SAVED_DECKS_KEY, JSON.stringify(saved.slice(0, 10)));
    window.dispatchEvent(new Event("sq_deck_updated"));
  } catch (e) {
    console.error("Failed to save active deck", e);
  }
}

export function getSavedDecks(): DeckInfo[] {
  try {
    const raw = localStorage.getItem(SAVED_DECKS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return [];
}

export function getAIConfig(): AIProviderConfig {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    provider: "builtin",
    geminiKey: "",
    openaiKey: "",
    model: "gemini-1.5-flash"
  };
}

export function setAIConfig(config: AIProviderConfig): void {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event("sq_aiconfig_updated"));
  } catch (e) {}
}

export function getPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    level: 1,
    xp: 40,
    streak: 1,
    coins: 120,
    stars: 5
  };
}

export function updatePlayerStats(delta: Partial<PlayerStats>): PlayerStats {
  const current = getPlayerStats();
  const updated: PlayerStats = {
    level: current.level + (delta.level ?? 0),
    xp: current.xp + (delta.xp ?? 0),
    streak: delta.streak !== undefined ? delta.streak : current.streak,
    coins: current.coins + (delta.coins ?? 0),
    stars: current.stars + (delta.stars ?? 0)
  };
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("sq_stats_updated"));
  } catch (e) {}
  return updated;
}
