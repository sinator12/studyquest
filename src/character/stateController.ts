import type { CharacterEvent, CharacterState, CharacterTransition } from "./types";

const transition = (
  state: CharacterState,
  dialogue: string,
  restingState: CharacterState,
  durationMs?: number,
): CharacterTransition => ({
  state,
  dialogue,
  ...(durationMs ? { durationMs, returnTo: restingState } : {}),
});

export function dispatchCharacterEvent(
  event: CharacterEvent,
  restingState: CharacterState,
): CharacterTransition {
  switch (event.type) {
    case "select-state":
      return transition(event.state, "Choose a preview event or inspect another state.", event.state);
    case "interact":
      return transition("wave", "Hi there!", restingState, 1800);
    case "question-started":
      return transition("thinking", "Take your time. Think it through.", restingState);
    case "answer-selected":
      return transition("curious", "I’m following your choice. Go when you’re ready.", restingState);
    case "answer-correct":
      return transition("happy", "Great job! Keep going!", restingState, 2100);
    case "answer-incorrect":
      return transition("confused", "That’s okay. Let’s learn from this one.", restingState, 2300);
    case "processing-started":
      return transition("running", "Your questions are coming!", restingState);
    case "processing-succeeded":
      return transition("celebrating", "Your preview adventure is ready!", restingState, 2500);
    case "processing-failed":
      return transition("confused", "The preview stopped here. Try again when you’re ready.", restingState, 2300);
    case "purchase-succeeded":
      return transition("celebrating", "A new companion joined this preview!", restingState, 2500);
    case "purchase-failed":
      return transition("disappointed", "Not enough coins in this preview.", restingState, 2300);
    case "question-stopped":
      return transition(restingState, "Preview paused. Start again whenever you like.", restingState);
    case "inactivity": {
      const nudges: Record<1 | 2 | 3 | 4, { state: CharacterState; dialogue: string }> = {
        1: { state: "curious", dialogue: "Take your time. Think carefully!" },
        2: { state: "frustrated", dialogue: "Need another hint?" },
        3: { state: "confused", dialogue: "You’ve got this. One step at a time." },
        4: { state: "frustrated", dialogue: "Still here when you’re ready." },
      };
      const nudge = nudges[event.step];
      return transition(nudge.state, nudge.dialogue, restingState, event.step === 4 ? 3500 : undefined);
    }
  }
}
