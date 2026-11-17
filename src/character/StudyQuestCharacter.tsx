import { useEffect, useRef, useState } from "react";
import { CHARACTER_ARTWORK, STATE_COPY } from "./artwork";
import { cropArtwork } from "./cropArtwork";
import { useCharacterMotion, useCharacterSpriteTransition } from "./useCharacterMotion";
import type { CharacterSize, CharacterState } from "./types";

interface StudyQuestCharacterProps {
  state: CharacterState;
  size?: CharacterSize;
  interactive?: boolean;
  dialogue?: string;
  reducedMotion?: boolean;
  onInteraction?: () => void;
}

interface SpriteLayers {
  current?: string;
  previous?: string;
}

export function StudyQuestCharacter({
  state,
  size = "large",
  interactive = true,
  dialogue,
  reducedMotion = false,
  onInteraction,
}: StudyQuestCharacterProps) {
  const artwork = CHARACTER_ARTWORK[state];
  const [sprites, setSprites] = useState<SpriteLayers>({});
  const [artworkError, setArtworkError] = useState(false);
  const motionRef = useRef<HTMLSpanElement>(null);
  const currentSpriteRef = useRef<HTMLImageElement>(null);
  const previousSpriteRef = useRef<HTMLImageElement>(null);
  const stateCopy = STATE_COPY[state];

  useCharacterMotion(motionRef, state, reducedMotion);
  useCharacterSpriteTransition({
    scopeRef: motionRef,
    currentRef: currentSpriteRef,
    previousRef: previousSpriteRef,
    currentSrc: sprites.current,
    previousSrc: sprites.previous,
    reducedMotion,
  });

  useEffect(() => {
    let active = true;
    setArtworkError(false);
    cropArtwork(artwork).then(
      (result) => {
        if (!active) return;
        setSprites((current) => ({
          current: result,
          previous: !reducedMotion && current.current !== result ? current.current : undefined,
        }));
      },
      () => {
        if (active) setArtworkError(true);
      },
    );
    return () => {
      active = false;
    };
  }, [artwork, reducedMotion]);

  const character = (
    <span
      ref={motionRef}
      className="character-art"
      aria-hidden="true"
    >
      {sprites.previous && (
        <img
          key={`previous-${sprites.previous}`}
          ref={previousSpriteRef}
          className="character-sprite-layer character-sprite-previous"
          src={sprites.previous}
          alt=""
          draggable={false}
        />
      )}
      {sprites.current ? (
        <img
          key={`current-${sprites.current}`}
          ref={currentSpriteRef}
          className="character-sprite-layer character-sprite-current"
          src={sprites.current}
          alt=""
          draggable={false}
        />
      ) : (
        <span className="sprite-loading">
          {artworkError ? "Character pose unavailable" : "Preparing pose…"}
        </span>
      )}
      {state === "shopping" && <span className="shop-glint">✦</span>}
    </span>
  );

  return (
    <div className={`character-wrap character-size-${size}`}>
      {dialogue && (
        <div className="dialogue-bubble" role="status" aria-live="polite">
          <span>{dialogue}</span>
          <i aria-hidden="true" />
        </div>
      )}
      {interactive ? (
        <button
          type="button"
          className="character-interaction"
          aria-label={`StudyQuest companion in the ${stateCopy.label.toLowerCase()} state. Activate to wave.`}
          onClick={onInteraction}
        >
          {character}
        </button>
      ) : character}
    </div>
  );
}
