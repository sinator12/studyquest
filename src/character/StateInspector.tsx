import { CHARACTER_STATES, type CharacterState } from "./types";
import { CHARACTER_ARTWORK, STATE_COPY } from "./artwork";

const groups: { title: string; states: CharacterState[] }[] = [
  { title: "At rest", states: ["idle", "wave"] },
  { title: "While you study", states: ["thinking", "curious", "reading"] },
  { title: "After a result", states: ["happy", "confused", "frustrated", "celebrating", "disappointed"] },
  { title: "Around the adventure", states: ["running", "shopping"] },
];

const glyphs: Record<CharacterState, string> = {
  idle: "·",
  wave: "✦",
  running: "›",
  thinking: "…",
  curious: "?",
  happy: "⌣",
  confused: "?",
  frustrated: "~",
  reading: "▤",
  celebrating: "★",
  disappointed: "…",
  shopping: "▣",
};

interface StateInspectorProps {
  selectedState: CharacterState;
  onSelect: (state: CharacterState) => void;
}

export function StateInspector({ selectedState, onSelect }: StateInspectorProps) {
  const selectedCopy = STATE_COPY[selectedState];
  const selectedArtwork = CHARACTER_ARTWORK[selectedState];

  return (
    <aside className="inspector-card" aria-labelledby="states-title">
      <div className="inspector-header">
        <div>
          <span className="section-label">State inspector</span>
          <h2 id="states-title">Character states</h2>
        </div>
        <span className="state-count">{CHARACTER_STATES.length}</span>
      </div>
      <p className="inspector-intro">Choose a response to inspect the supplied pose and its motion.</p>

      <div className="state-groups">
        {groups.map((group) => (
          <section className="state-group" key={group.title} aria-label={group.title}>
            <h3>{group.title}</h3>
            <div className="state-list">
              {group.states.map((state) => {
                const isSelected = state === selectedState;
                return (
                  <button
                    className={`state-button${isSelected ? " is-selected" : ""}`}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onSelect(state)}
                    key={state}
                  >
                    <span className={`state-glyph glyph-${state}`} aria-hidden="true">{glyphs[state]}</span>
                    <span>{STATE_COPY[state].label}</span>
                    <span className="state-indicator" aria-hidden="true">{isSelected ? "Selected" : ""}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="selected-state-note" aria-live="polite">
        <span className={`note-glyph glyph-${selectedState}`} aria-hidden="true">{glyphs[selectedState]}</span>
        <div>
          <strong>{selectedCopy.label}</strong>
          <p>{selectedCopy.description}</p>
          <small>{selectedArtwork.note}</small>
        </div>
      </div>

      <div className="inspector-footnote">
        <span className="footnote-mark">i</span>
        <p>Some states reuse a supplied pose with a small, state-specific movement.</p>
      </div>
    </aside>
  );
}
