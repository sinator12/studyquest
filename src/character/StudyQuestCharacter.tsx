import React, { useState } from "react";
import type { CharacterSize, CharacterState } from "./types";
import { STATE_COPY } from "./artwork";

interface StudyQuestCharacterProps {
  state: CharacterState;
  size?: CharacterSize;
  interactive?: boolean;
  dialogue?: string;
  reducedMotion?: boolean;
  onInteraction?: () => void;
}

export function StudyQuestCharacter({
  state = "idle",
  size = "large",
  interactive = true,
  dialogue,
  reducedMotion = false,
  onInteraction
}: StudyQuestCharacterProps) {
  const [isHovered, setIsHovered] = useState(false);
  const stateCopy = STATE_COPY[state] || { label: "Idle", prompt: "Hello!" };

  // Compute size pixel dimensions
  const dim = size === "small" ? 92 : size === "medium" ? 140 : 180;

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
          aria-label={`StudyQuest companion in the ${stateCopy.label.toLowerCase()} state. Click to interact.`}
          onClick={onInteraction}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
        >
          <CharacterSvg state={state} size={dim} isHovered={isHovered} reducedMotion={reducedMotion} />
        </button>
      ) : (
        <CharacterSvg state={state} size={dim} isHovered={isHovered} reducedMotion={reducedMotion} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pure SVG Vector StudyQuest Character (Bean & Brain Gamepad)
// ---------------------------------------------------------------------------
interface CharacterSvgProps {
  state: CharacterState;
  size: number;
  isHovered: boolean;
  reducedMotion: boolean;
}

function CharacterSvg({ state, size, isHovered, reducedMotion }: CharacterSvgProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      fill="none"
      className={`sq-char-svg state-${state} ${reducedMotion ? "no-motion" : ""} ${isHovered ? "hovered" : ""}`}
      style={{
        overflow: "visible",
        filter: isHovered
          ? "drop-shadow(0 10px 20px rgba(124, 58, 237, 0.45))"
          : "drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35))",
        transition: "filter 0.2s ease, transform 0.2s ease"
      }}
    >
      <defs>
        {/* Glow Filters */}
        <filter id="brainGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <radialGradient id="brainGrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="60%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="gripGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
      </defs>

      {/* ── BACKGROUND / ACCESSORY EFFECTS BASED ON STATE ── */}
      {state === "celebrating" && (
        <g className="sq-fx-confetti">
          <circle cx="40" cy="40" r="4" fill="#F43F5E" />
          <polygon points="160,35 165,45 155,45" fill="#3B82F6" />
          <rect x="30" y="80" width="6" height="6" fill="#10B981" transform="rotate(25 30 80)" />
          <circle cx="170" cy="75" r="3.5" fill="#F59E0B" />
          <polygon points="100,10 103,17 110,18 105,23 106,30 100,26 94,30 95,23 90,18 97,17" fill="#FBBF24" />
        </g>
      )}

      {state === "shopping" && (
        <g className="sq-fx-shopping">
          <circle cx="160" cy="65" r="14" fill="#F59E0B" stroke="#FBBF24" strokeWidth="2.5" />
          <polygon points="160,56 163,62 169,63 165,67 166,73 160,70 154,73 155,67 151,63 157,62" fill="#FEF08A" />
          <text x="178" y="55" fill="#FBBF24" fontSize="16" fontWeight="bold">✦</text>
        </g>
      )}

      {state === "thinking" && (
        <g className="sq-fx-thinking">
          <circle cx="155" cy="50" r="13" fill="#8B5CF6" stroke="#DDD6FE" strokeWidth="2" />
          <text x="155" y="55" fill="#FFFFFF" fontSize="15" fontWeight="900" textAnchor="middle" dominantBaseline="middle">?</text>
          <circle cx="140" cy="65" r="4" fill="#8B5CF6" />
        </g>
      )}

      {state === "curious" && (
        <g className="sq-fx-curious">
          <circle cx="152" cy="48" r="11" fill="#06B6D4" stroke="#CFFAFE" strokeWidth="2" />
          <text x="152" y="52" fill="#FFFFFF" fontSize="13" fontWeight="900" textAnchor="middle" dominantBaseline="middle">?</text>
        </g>
      )}

      {state === "confused" && (
        <g className="sq-fx-confused">
          <text x="35" y="55" fill="#A78BFA" fontSize="18" fontWeight="bold">?</text>
          <text x="160" y="50" fill="#A78BFA" fontSize="22" fontWeight="bold">?</text>
        </g>
      )}

      {state === "disappointed" && (
        <g className="sq-fx-sweatdrop">
          <path d="M152 70 C152 70 160 82 160 86 C160 90 156 93 152 93 C148 93 144 90 144 86 C144 82 152 70 152 70 Z" fill="#38BDF8" />
        </g>
      )}

      {state === "reading" && (
        <g className="sq-fx-book" transform="translate(65, 130)">
          {/* Open Book */}
          <path d="M0 0 C15 -5 30 -5 35 15 C30 18 15 16 0 12 Z" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
          <path d="M70 0 C55 -5 40 -5 35 15 C40 18 55 16 70 12 Z" fill="#F8FAFC" stroke="#475569" strokeWidth="1.5" />
          <rect x="33" y="2" width="4" height="16" fill="#D97706" />
          {/* Book lines */}
          <line x1="8" y1="4" x2="26" y2="2" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="8" y1="8" x2="24" y2="6" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="44" y1="2" x2="62" y2="4" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="46" y1="6" x2="62" y2="8" stroke="#94A3B8" strokeWidth="1.5" />
        </g>
      )}

      {/* ── LEGS AND FEET ── */}
      <g className={`sq-char-legs ${state === "running" ? "sq-anim-running-legs" : ""}`}>
        {/* Left Leg & Foot */}
        <rect x="74" y="145" width="12" height="26" rx="6" fill="#6D28D9" />
        <ellipse cx="76" cy="172" rx="16" ry="9" fill="#5B21B6" />
        <ellipse cx="76" cy="171" rx="12" ry="6" fill="#7C3AED" />

        {/* Right Leg & Foot */}
        <rect x="114" y="145" width="12" height="26" rx="6" fill="#6D28D9" />
        <ellipse cx="124" cy="172" rx="16" ry="9" fill="#5B21B6" />
        <ellipse cx="124" cy="171" rx="12" ry="6" fill="#7C3AED" />
      </g>

      {/* ── GAMEPAD CONTROLLER BODY ── */}
      <g className={`sq-char-body-group ${state === "celebrating" ? "sq-anim-celebrate" : ""}`}>
        {/* Controller Left & Right Grips */}
        <rect x="36" y="94" width="36" height="58" rx="18" fill="url(#gripGrad)" />
        <rect x="128" y="94" width="36" height="58" rx="18" fill="url(#gripGrad)" />

        {/* Main Central Gamepad Shell */}
        <rect x="44" y="82" width="112" height="66" rx="28" fill="url(#bodyGrad)" />

        {/* Top Arc connecting the grips */}
        <path d="M48 88 Q100 70 152 88" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" opacity="0.6" />

        {/* D-Pad Buttons (Left) */}
        <g transform="translate(56, 104)">
          <rect x="6" y="0" width="7" height="19" rx="3" fill="#C4B5FD" />
          <rect x="0" y="6" width="19" height="7" rx="3" fill="#C4B5FD" />
          <circle cx="9.5" cy="9.5" r="2" fill="#7C3AED" />
        </g>

        {/* Action Buttons (Right) */}
        <g transform="translate(125, 102)">
          <circle cx="9" cy="4" r="3.5" fill="#F43F5E" />
          <circle cx="16" cy="11" r="3.5" fill="#3B82F6" />
          <circle cx="2" cy="11" r="3.5" fill="#10B981" />
          <circle cx="9" cy="18" r="3.5" fill="#FBBF24" />
        </g>

        {/* ── GOLDEN SMILING FACE BADGE (CENTER) ── */}
        <circle cx="100" cy="114" r="21" fill="#FBBF24" stroke="#F59E0B" strokeWidth="2.5" />

        {/* Eyebrows */}
        {state === "frustrated" ? (
          <g stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round">
            <line x1="91" y1="104" x2="98" y2="107" />
            <line x1="109" y1="107" x2="102" y2="104" />
          </g>
        ) : state === "thinking" || state === "curious" ? (
          <g stroke="#1E1B4B" strokeWidth="1.8" strokeLinecap="round">
            <path d="M91 106 Q95 103 99 105" />
            <path d="M101 103 Q105 101 109 104" />
          </g>
        ) : (
          <g stroke="#1E1B4B" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
            <path d="M91 106 Q95 104 99 106" />
            <path d="M101 106 Q105 104 109 106" />
          </g>
        )}

        {/* Eyes */}
        {state === "happy" || state === "celebrating" ? (
          /* Cheerful curved crescent eyes ^_^ */
          <g stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round">
            <path d="M91 113 Q95 108 99 113" />
            <path d="M101 113 Q105 108 109 113" />
          </g>
        ) : state === "confused" ? (
          /* Swirly eyes @ _ @ */
          <g stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round">
            <circle cx="95" cy="112" r="3.5" />
            <circle cx="105" cy="112" r="3.5" />
          </g>
        ) : (
          /* Normal expressive eyes with gleam */
          <g>
            <ellipse cx="94" cy="112" rx="3" ry="4" fill="#1E1B4B" />
            <ellipse cx="106" cy="112" rx="3" ry="4" fill="#1E1B4B" />
            <circle cx="95" cy="110.5" r="1.2" fill="#FFFFFF" />
            <circle cx="107" cy="110.5" r="1.2" fill="#FFFFFF" />
          </g>
        )}

        {/* Nerd Glasses for reading state */}
        {state === "reading" && (
          <g stroke="#334155" strokeWidth="2" fill="none">
            <circle cx="94" cy="112" r="7" fill="rgba(255,255,255,0.3)" />
            <circle cx="106" cy="112" r="7" fill="rgba(255,255,255,0.3)" />
            <line x1="101" y1="112" x2="99" y2="112" strokeWidth="2.5" />
          </g>
        )}

        {/* Rosy Cheeks */}
        <ellipse cx="90" cy="118" rx="2.8" ry="1.6" fill="#F87171" opacity="0.85" />
        <ellipse cx="110" cy="118" rx="2.8" ry="1.6" fill="#F87171" opacity="0.85" />

        {/* Mouth */}
        {state === "happy" || state === "celebrating" ? (
          /* Big Open Smiling Mouth :D */
          <path d="M94 119 Q100 127 106 119 Z" fill="#991B1B" stroke="#1E1B4B" strokeWidth="1.5" />
        ) : state === "disappointed" || state === "frustrated" ? (
          /* Sad / Pouting Frown */
          <path d="M95 123 Q100 119 105 123" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />
        ) : (
          /* Sweet Cheerful Smile */
          <path d="M95 120 Q100 124 105 120" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* ── GOLDEN GLOWING BRAIN (ON TOP OF HEAD) ── */}
        <g className="sq-char-brain" filter="url(#brainGlow)">
          {/* Left and Right Brain Lobes */}
          <ellipse cx="84" cy="46" rx="24" ry="20" fill="url(#brainGrad)" />
          <ellipse cx="116" cy="46" rx="24" ry="20" fill="url(#brainGrad)" />
          <ellipse cx="100" cy="48" rx="18" ry="16" fill="#F59E0B" />

          {/* Brain Sulcus Folds */}
          <path d="M72 44 C75 36 88 34 94 42 C96 46 88 54 80 50" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
          <path d="M128 44 C125 36 112 34 106 42 C104 46 112 54 120 50" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
          <line x1="100" y1="30" x2="100" y2="60" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>

      {/* ── ARMS (EXPRESSIVE ANIMATED POSES) ── */}
      {state === "wave" ? (
        <g className="sq-char-arms">
          {/* Left arm resting */}
          <path d="M42 105 C30 115 28 128 36 136" stroke="#6D28D9" strokeWidth="7" strokeLinecap="round" />
          {/* Right arm waving happily */}
          <g className="sq-anim-waving-arm">
            <path d="M156 102 C168 90 178 72 168 58" stroke="#6D28D9" strokeWidth="7" strokeLinecap="round" />
            <circle cx="168" cy="58" r="6" fill="#7C3AED" />
            <text x="178" y="52" fill="#FBBF24" fontSize="14">✦</text>
          </g>
        </g>
      ) : state === "celebrating" ? (
        <g className="sq-char-arms sq-anim-celebrate-arms">
          {/* Both arms raised high! */}
          <path d="M44 98 C32 80 30 62 42 50" stroke="#6D28D9" strokeWidth="7" strokeLinecap="round" />
          <circle cx="42" cy="50" r="6" fill="#7C3AED" />
          <path d="M156 98 C168 80 170 62 158 50" stroke="#6D28D9" strokeWidth="7" strokeLinecap="round" />
          <circle cx="158" cy="50" r="6" fill="#7C3AED" />
        </g>
      ) : state === "thinking" ? (
        <g className="sq-char-arms">
          {/* Left arm down */}
          <path d="M42 105 C32 118 30 130 38 138" stroke="#6D28D9" strokeWidth="7" strokeLinecap="round" />
          {/* Right hand on chin */}
          <path d="M156 108 C150 124 135 132 115 128" stroke="#6D28D9" strokeWidth="7" strokeLinecap="round" />
          <circle cx="115" cy="128" r="5.5" fill="#7C3AED" />
        </g>
      ) : state === "reading" ? (
        <g className="sq-char-arms">
          {/* Arms holding the book */}
          <path d="M42 108 C50 125 62 135 70 135" stroke="#6D28D9" strokeWidth="7" strokeLinecap="round" />
          <path d="M158 108 C150 125 138 135 130 135" stroke="#6D28D9" strokeWidth="7" strokeLinecap="round" />
        </g>
      ) : (
        /* Normal Idle Arms */
        <g className="sq-char-arms">
          <path d="M42 105 C30 118 28 130 36 138" stroke="#6D28D9" strokeWidth="7" strokeLinecap="round" />
          <path d="M158 105 C170 118 172 130 164 138" stroke="#6D28D9" strokeWidth="7" strokeLinecap="round" />
        </g>
      )}

      {/* ── ANIMATION STYLES ── */}
      <style>{`
        .sq-char-svg:not(.no-motion) .sq-char-brain {
          animation: sq-brain-breathe 2.8s ease-in-out infinite;
          transform-origin: 100px 48px;
        }
        .sq-char-svg:not(.no-motion).state-idle {
          animation: sq-idle-sway 3.2s ease-in-out infinite;
          transform-origin: 100px 172px;
        }
        .sq-anim-waving-arm {
          animation: sq-wave-arm 0.7s ease-in-out infinite alternate;
          transform-origin: 156px 102px;
        }
        .sq-anim-running-legs {
          animation: sq-run-cycle 0.4s linear infinite alternate;
          transform-origin: 100px 145px;
        }
        .sq-anim-celebrate {
          animation: sq-jump-bounce 0.6s ease-in-out infinite alternate;
          transform-origin: 100px 172px;
        }
        @keyframes sq-brain-breathe {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px #F59E0B); }
          50% { transform: scale(1.04); filter: drop-shadow(0 0 10px #FBBF24); }
        }
        @keyframes sq-idle-sway {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes sq-wave-arm {
          0% { transform: rotate(-8deg); }
          100% { transform: rotate(14deg); }
        }
        @keyframes sq-run-cycle {
          0% { transform: skewX(-6deg); }
          100% { transform: skewX(6deg); }
        }
        @keyframes sq-jump-bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-10px); }
        }
      `}</style>
    </svg>
  );
}
