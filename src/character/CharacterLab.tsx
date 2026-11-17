import { useCallback, useEffect, useRef, useState } from "react";
import { CharacterStage } from "./CharacterStage";
import { PreviewControls } from "./PreviewControls";
import { StateInspector } from "./StateInspector";
import { useInactivityNudge } from "./useInactivityNudge";
import { dispatchCharacterEvent } from "./stateController";
import { STATE_COPY } from "./artwork";
import type { CharacterEvent, CharacterState } from "./types";

const DEFAULT_DIALOGUE = "Choose a state to explore the companion’s response.";

function BookMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="book-mark">
      <path d="M7 12.5c6.5-2.2 12-.6 17 3.2v22c-5.3-3.7-10.8-4.8-17-2.3z" />
      <path d="M41 12.5c-6.5-2.2-12-.6-17 3.2v22c5.3-3.7 10.8-4.8 17-2.3z" />
      <path d="m24 14 3.4-4.5 3.4 4.5" className="book-star" />
      <path d="M12 18.5c3-.3 5.8.3 8 1.7M12 24c3-.3 5.8.3 8 1.7M36 18.5c-3-.3-5.8.3-8 1.7M36 24c-3-.3-5.8.3-8 1.7" className="book-lines" />
    </svg>
  );
}

export default function CharacterLab() {
  useEffect(() => {
    document.title = "Character lab · StudyQuest";
  }, []);

  const [selectedState, setSelectedState] = useState<CharacterState>("idle");
  const [currentState, setCurrentState] = useState<CharacterState>("idle");
  const [dialogue, setDialogue] = useState(DEFAULT_DIALOGUE);
  const [questionActive, setQuestionActive] = useState(false);
  const [questionPaused, setQuestionPaused] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const [systemReducedMotion, setSystemReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [manualReducedMotion, setManualReducedMotion] = useState<boolean | null>(null);
  const reducedMotion = manualReducedMotion ?? systemReducedMotion;
  const [nudgeOverride, setNudgeOverride] = useState<boolean | null>(null);
  const nudgeEnabled = nudgeOverride ?? !systemReducedMotion;
  const reactionTimer = useRef<number | undefined>(undefined);

  const clearReactionTimer = useCallback(() => {
    if (reactionTimer.current !== undefined) window.clearTimeout(reactionTimer.current);
    reactionTimer.current = undefined;
  }, []);

  const sendEvent = useCallback((event: CharacterEvent) => {
    clearReactionTimer();
    if (
      event.type === "answer-selected" ||
      event.type === "answer-correct" ||
      event.type === "answer-incorrect"
    ) {
      setQuestionActive(false);
      setQuestionPaused(false);
    }
    const result = dispatchCharacterEvent(event, selectedState);
    setCurrentState(result.state);
    setDialogue(result.dialogue);

    if (result.durationMs && result.returnTo) {
      reactionTimer.current = window.setTimeout(() => {
        setCurrentState(result.returnTo!);
        setDialogue(STATE_COPY[result.returnTo!].description);
        reactionTimer.current = undefined;
      }, result.durationMs);
    }
  }, [clearReactionTimer, selectedState]);

  const selectState = useCallback((state: CharacterState) => {
    clearReactionTimer();
    setSelectedState(state);
    setQuestionActive(false);
    setQuestionPaused(false);
    const result = dispatchCharacterEvent({ type: "select-state", state }, state);
    setCurrentState(result.state);
    setDialogue(result.dialogue);
  }, [clearReactionTimer]);

  const beginQuestion = useCallback(() => {
    clearReactionTimer();
    setQuestionKey((current) => current + 1);
    setQuestionActive(true);
    setQuestionPaused(false);
    sendEvent({ type: "question-started" });
  }, [clearReactionTimer, sendEvent]);

  const togglePause = useCallback(() => {
    if (questionPaused) {
      setQuestionPaused(false);
      sendEvent({ type: "question-started" });
      return;
    }
    setQuestionPaused(true);
    sendEvent({ type: "question-stopped" });
  }, [questionPaused, sendEvent]);

  const deactivateQuestion = useCallback(() => {
    setQuestionActive(false);
    setQuestionPaused(false);
    sendEvent({ type: "question-stopped" });
  }, [sendEvent]);

  useInactivityNudge({
    active: questionActive,
    paused: questionPaused,
    questionKey,
    enabled: nudgeEnabled,
    onNudge: (step) => sendEvent({ type: "inactivity", step }),
    onDeactivate: deactivateQuestion,
  });

  useEffect(() => () => clearReactionTimer(), [clearReactionTimer]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReducedMotion(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  const pauseOrResume = () => {
    if (questionActive) {
      togglePause();
      return;
    }
    beginQuestion();
  };

  const resetPreview = () => {
    selectState("idle");
    setDialogue(DEFAULT_DIALOGUE);
    setQuestionKey((current) => current + 1);
  };

  return (
    <main className={`app-shell${reducedMotion ? " is-reduced-motion" : ""}`}>
      <header className="topbar">
        <a className="brand-lockup" href="#top" aria-label="StudyQuest character lab">
          <span className="brand-icon"><BookMark /></span>
          <span className="brand-copy">
            <strong>StudyQuest</strong>
            <small>Character lab</small>
          </span>
        </a>
        <div className="preview-badge"><span className="badge-dot" />Preview only</div>
      </header>

      <section className="intro" id="top" aria-labelledby="page-title">
        <div className="intro-main">
          <p className="eyebrow"><span className="eyebrow-mark" />A companion for every chapter</p>
          <h1 id="page-title">Character <span>lab</span></h1>
          <p className="intro-copy">
            Meet the little guide who shows up for the thinking, the trying,
            and the getting there.
          </p>
        </div>
        <aside className="intro-note" aria-label="Preview scope">
          <span className="note-star" aria-hidden="true">✦</span>
          <div>
            <strong>One character, many moods</strong>
            <p>Choose a state to see how the companion responds during a study session.</p>
          </div>
        </aside>
      </section>

      <section className="workspace" aria-label="Character state preview">
        <CharacterStage
          state={currentState}
          dialogue={dialogue}
          reducedMotion={reducedMotion}
          onInteraction={() => sendEvent({ type: "interact" })}
        />
        <StateInspector selectedState={selectedState} onSelect={selectState} />
      </section>

      <PreviewControls
        questionActive={questionActive}
        paused={questionPaused}
        nudgeEnabled={nudgeEnabled}
        reducedMotion={reducedMotion}
        motionPreferenceSource={manualReducedMotion === null ? "Device default" : "Preview override"}
        onEvent={sendEvent}
        onBeginQuestion={beginQuestion}
        onPauseQuestion={pauseOrResume}
        onToggleNudges={() => setNudgeOverride(!nudgeEnabled)}
        onToggleReducedMotion={() => setManualReducedMotion((current) => !(current ?? systemReducedMotion))}
        onReset={resetPreview}
      />

      <footer className="page-footer">
        <span>StudyQuest character system</span>
        <span><span className="footer-star">✦</span>Built for curiosity, not pressure</span>
      </footer>
    </main>
  );
}
