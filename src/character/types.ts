export const CHARACTER_STATES = [
  "idle",
  "wave",
  "running",
  "thinking",
  "curious",
  "happy",
  "confused",
  "frustrated",
  "reading",
  "celebrating",
  "disappointed",
  "shopping",
] as const;

export type CharacterState = (typeof CHARACTER_STATES)[number];

export type CharacterEvent =
  | { type: "select-state"; state: CharacterState }
  | { type: "interact" }
  | { type: "answer-selected" }
  | { type: "answer-correct" }
  | { type: "answer-incorrect" }
  | { type: "processing-started" }
  | { type: "processing-succeeded" }
  | { type: "processing-failed" }
  | { type: "purchase-succeeded" }
  | { type: "purchase-failed" }
  | { type: "question-started" }
  | { type: "question-stopped" }
  | { type: "inactivity"; step: 1 | 2 | 3 | 4 };

export interface CharacterTransition {
  state: CharacterState;
  dialogue: string;
  durationMs?: number;
  returnTo?: CharacterState;
}

export type CharacterSize = "small" | "medium" | "large";
