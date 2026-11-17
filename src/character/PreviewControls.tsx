import type { CharacterEvent } from "./types";

interface PreviewControlsProps {
  questionActive: boolean;
  paused: boolean;
  nudgeEnabled: boolean;
  reducedMotion: boolean;
  motionPreferenceSource: string;
  onEvent: (event: CharacterEvent) => void;
  onBeginQuestion: () => void;
  onPauseQuestion: () => void;
  onToggleNudges: () => void;
  onToggleReducedMotion: () => void;
  onReset: () => void;
}

export function PreviewControls({
  questionActive,
  paused,
  nudgeEnabled,
  reducedMotion,
  motionPreferenceSource,
  onEvent,
  onBeginQuestion,
  onPauseQuestion,
  onToggleNudges,
  onToggleReducedMotion,
  onReset,
}: PreviewControlsProps) {
  return (
    <section className="preview-panel" aria-labelledby="controls-title">
      <div className="preview-panel-heading">
        <div className="controls-title-row">
          <h2 id="controls-title">Preview controls</h2>
          <span className="dev-only-badge">Development only</span>
        </div>
        <p>Simulate a study moment. Nothing is submitted, purchased, or added to an account.</p>
      </div>

      <div className="control-groups">
        <fieldset className="control-group">
          <legend>Question preview</legend>
          <div className="control-buttons">
            <button className="control-button control-button-primary" type="button" onClick={onBeginQuestion}>
              {questionActive ? "Restart question" : "Start quiet question"}
            </button>
            <button
              className="control-button"
              type="button"
              disabled={!questionActive}
              onClick={() => onEvent({ type: "answer-selected" })}
            >
              Select an answer
            </button>
            <button
              className="control-button control-button-success"
              type="button"
              onClick={() => onEvent({ type: "answer-correct" })}
            >
              Correct answer
            </button>
            <button
              className="control-button"
              type="button"
              onClick={() => onEvent({ type: "answer-incorrect" })}
            >
              Incorrect answer
            </button>
            {questionActive && (
              <button className="control-button control-button-quiet" type="button" onClick={onPauseQuestion}>
                {paused ? "Resume question" : "Pause question"}
              </button>
            )}
          </div>
        </fieldset>

        <fieldset className="control-group">
          <legend>Other previews</legend>
          <div className="control-buttons">
            <button className="control-button" type="button" onClick={() => onEvent({ type: "processing-started" })}>Start processing</button>
            <button className="control-button" type="button" onClick={() => onEvent({ type: "processing-succeeded" })}>Processing success</button>
            <button className="control-button" type="button" onClick={() => onEvent({ type: "processing-failed" })}>Processing failure</button>
            <button className="control-button" type="button" onClick={() => onEvent({ type: "purchase-succeeded" })}>Purchase success</button>
            <button className="control-button" type="button" onClick={() => onEvent({ type: "purchase-failed" })}>Not enough coins</button>
          </div>
        </fieldset>
      </div>

      <footer className="preview-controls-footer">
        <div className="preference-toggles">
          <label className="toggle-control">
            <input type="checkbox" checked={nudgeEnabled} onChange={onToggleNudges} />
            <span className="toggle-track" aria-hidden="true"><i /></span>
            <span>Gentle inactivity nudges</span>
          </label>
          <label className="toggle-control">
            <input type="checkbox" checked={reducedMotion} onChange={onToggleReducedMotion} />
            <span className="toggle-track" aria-hidden="true"><i /></span>
            <span>Reduce motion</span>
            <small className="preference-note">{motionPreferenceSource}</small>
          </label>
        </div>
        <div className="preview-footer-actions">
          <span className="preview-status">{questionActive ? paused ? "Question paused" : "Unanswered question active" : "No active question"}</span>
          <button className="reset-button" type="button" onClick={onReset}>Reset preview</button>
        </div>
      </footer>
    </section>
  );
}
