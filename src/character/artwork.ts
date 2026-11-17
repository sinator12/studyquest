import type { CharacterState } from "./types";

export interface SourceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CharacterArtwork {
  src: string;
  rect: SourceRect;
  sourceName: string;
  note: string;
  exactPose: boolean;
}

const reference = "/assets/references/studyquest-main-character-reference.png";
const idlePose: SourceRect = { x: 42, y: 780, width: 136, height: 194 };
const thinkingPose: SourceRect = { x: 202, y: 786, width: 138, height: 184 };
const winPose: SourceRect = { x: 883, y: 593, width: 125, height: 132 };

export const CHARACTER_ARTWORK: Record<CharacterState, CharacterArtwork> = {
  idle: {
    src: reference,
    rect: idlePose,
    sourceName: "Idle pose",
    note: "Supplied idle pose with gentle GSAP breathing; no idle frame sheet was supplied.",
    exactPose: true,
  },
  wave: {
    src: reference,
    rect: { x: 1390, y: 593, width: 119, height: 135 },
    sourceName: "Wave pose",
    note: "Supplied wave pose with a smooth GSAP sway; no aligned wave frames were supplied.",
    exactPose: true,
  },
  running: {
    src: reference,
    rect: { x: 731, y: 783, width: 150, height: 181 },
    sourceName: "Running pose",
    note: "Supplied running pose with a smooth run-in-place loop; limb frames are not supplied.",
    exactPose: true,
  },
  thinking: {
    src: reference,
    rect: thinkingPose,
    sourceName: "Thinking pose",
    note: "Supplied thinking pose with a subtle GSAP nod; no separate thinking frames were supplied.",
    exactPose: true,
  },
  curious: {
    src: reference,
    rect: thinkingPose,
    sourceName: "Thinking pose",
    note: "Reuses the thinking pose with a small attentive lean.",
    exactPose: false,
  },
  happy: {
    src: reference,
    rect: winPose,
    sourceName: "Win pose",
    note: "Reuses the supplied win pose with a shorter, gentler bounce.",
    exactPose: false,
  },
  confused: {
    src: reference,
    rect: thinkingPose,
    sourceName: "Thinking pose",
    note: "Reuses the thinking pose with a brief puzzled tilt.",
    exactPose: false,
  },
  frustrated: {
    src: reference,
    rect: thinkingPose,
    sourceName: "Thinking pose",
    note: "Reuses the thinking pose with a restrained foot tap.",
    exactPose: false,
  },
  reading: {
    src: reference,
    rect: { x: 399, y: 791, width: 115, height: 171 },
    sourceName: "Reading pose",
    note: "Supplied reading pose with a subtle GSAP breath; no page-turn frame was supplied.",
    exactPose: true,
  },
  celebrating: {
    src: reference,
    rect: winPose,
    sourceName: "Win pose",
    note: "Supplied win pose with a smooth victory jump; no aligned celebration frames were supplied.",
    exactPose: true,
  },
  disappointed: {
    src: reference,
    rect: { x: 1008, y: 593, width: 128, height: 135 },
    sourceName: "Sit pose",
    note: "Uses the supplied sit pose for a quiet, gentle response.",
    exactPose: false,
  },
  shopping: {
    src: reference,
    rect: idlePose,
    sourceName: "Idle pose",
    note: "Reuses the idle pose with a small look toward the shop preview.",
    exactPose: false,
  },
};

export const STATE_COPY: Record<CharacterState, { label: string; description: string }> = {
  idle: { label: "Idle", description: "A calm pause between study moments." },
  wave: { label: "Wave", description: "A quick hello when the companion is greeted." },
  running: { label: "Running", description: "A processing preview while a study task is underway." },
  thinking: { label: "Thinking", description: "Quiet company while a question is still unanswered." },
  curious: { label: "Curious", description: "An attentive response after a choice is selected." },
  happy: { label: "Happy", description: "A short, encouraging response to a correct answer." },
  confused: { label: "Confused", description: "A gentle reaction to an incorrect or unclear result." },
  frustrated: { label: "Frustrated", description: "A mild nudge after a long pause; never a penalty." },
  reading: { label: "Reading", description: "A quiet reading pose for notes and explanations." },
  celebrating: { label: "Celebrating", description: "A brief celebration after a preview success." },
  disappointed: { label: "Disappointed", description: "A soft response when a preview action cannot continue." },
  shopping: { label: "Shopping", description: "A curious look around the character shop preview." },
};
