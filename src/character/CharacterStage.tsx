import { Sparkle } from "./icons";
import { CHARACTER_ARTWORK, STATE_COPY } from "./artwork";
import { StudyQuestCharacter } from "./StudyQuestCharacter";
import type { CharacterState } from "./types";

interface CharacterStageProps {
  state: CharacterState;
  dialogue: string;
  reducedMotion: boolean;
  onInteraction: () => void;
}

export function CharacterStage({ state, dialogue, reducedMotion, onInteraction }: CharacterStageProps) {
  return (
    <article className="stage-card" aria-label="Character stage">
      <header className="stage-header">
        <div>
          <span className="section-label">Character preview</span>
          <h2>Your study companion</h2>
        </div>
        <div className="current-state"><span className="status-dot" />{STATE_COPY[state].label}</div>
      </header>

      <div className={`stage stage-state-${state}`} aria-label={`Character preview: ${STATE_COPY[state].label}`}>
        <div className="stage-sky" aria-hidden="true">
          <span className="pixel-star star-one"><Sparkle /></span>
          <span className="pixel-star star-two"><Sparkle /></span>
          <span className="pixel-star star-three"><Sparkle /></span>
          <span className="sky-moon" />
          <span className="sky-cloud cloud-one" />
          <span className="sky-cloud cloud-two" />
        </div>

        <div className="stage-prompt">
          <span className="hint-icon"><Sparkle /></span>
          <span>Showing: {STATE_COPY[state].label}</span>
        </div>

        <div className="character-platform" aria-hidden="true">
          <span className="platform-grass grass-left" />
          <span className="platform-grass grass-right" />
          <span className="platform-flower" />
          <span className="platform-top" />
          <span className="platform-side" />
        </div>

        <div className="character-stage-position">
          <StudyQuestCharacter
            state={state}
            size="large"
            dialogue={dialogue}
            reducedMotion={reducedMotion}
            onInteraction={onInteraction}
          />
        </div>

      </div>

      <footer className="stage-footer">
        <span className="keyboard-hint"><kbd>Tab</kbd> to move through controls</span>
        <span className={`pose-status${CHARACTER_ARTWORK[state].exactPose ? " is-supplied" : ""}`}>
          <span className="pose-indicator" />
          {CHARACTER_ARTWORK[state].exactPose ? "Supplied pose" : "Pose variation"}
        </span>
      </footer>
    </article>
  );
}
