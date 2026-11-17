# StudyQuest Character Lab Implementation Plan

> **For agentic workers:** Implement this plan task by task in the current Codex session. This plan does not add automated tests, per the session instruction.

**Goal:** Create a responsive, reusable preview for StudyQuest's main character and its twelve planned states.

**Architecture:** A small Vite React TypeScript app hosts a character lab. A typed state controller drives one reusable character component, while preview controls simulate development-only events. Supplied reference boards are stored separately and pose crops are processed in the browser to remove connected light backgrounds without erasing enclosed white clothing.

**Tech Stack:** Vite, React, TypeScript, GSAP, CSS, browser Canvas API.

**Spec:** `docs/superpowers/specs/2026-11-12-studyquest-character-preview-design.md`

## Global Constraints

- Limit work to the Phase 1 character system and preview.
- Preserve the protagonist's brown hair, white shirt, blue tie, dark blue pants, blue-and-white shoes, and blue backpack.
- Keep pixel art crisp; respect reduced-motion preference.
- Mark all simulated product events as preview controls.
- Never imply that missing poses or flows are production-backed.
- No automated tests will be added or run in this task.

## Review Focus

- The sprite crop must keep the character's light shirt while removing the connected pale board background.
- Temporary character reactions must return to the user's current selected state without racing each other.
- The inactivity nudge must stop on answer selection, question reset, pause, and hidden page.
- Reduced motion must stop nonessential character and effect animation.
- Mobile controls must remain visible and keyboard reachable after the stage stacks above them.

---

### Task 1: Create the app shell and reference asset library

**Files:**
- Create: `.gitignore`, `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles.css`
- Create: `public/assets/references/studyquest-main-character-reference.png`
- Create: `public/assets/references/studyquest-brand-and-character-assets.png`
- Create: `public/assets/references/studyquest-ui-design-mockup.png`

**Interfaces:**
- Produces: Vite entry at `/`, global color/type tokens, and local reference image URLs under `/assets/references/`.

- [x] Create the Vite React TypeScript project files and dependency scripts.
- [x] Copy the three supplied reference boards into the named public directory without modifying their originals.
- [x] Add a responsive shell with the page title, preview-only badge, stage region, and control region.
- [x] Establish the approved palette, clear focus styles, and reduced-motion CSS baseline.
- [ ] Launch the development server and inspect the shell at desktop and mobile widths. Mobile was visually inspected; desktop inspection is outstanding because the available in-app browser was narrow and native desktop browser access timed out.

### Task 2: Implement the typed character artwork and state controller

**Files:**
- Create: `src/character/types.ts`
- Create: `src/character/artwork.ts`
- Create: `src/character/cropArtwork.ts`
- Create: `src/character/stateController.ts`
- Create: `src/character/StudyQuestCharacter.tsx`
- Create: `src/character/CharacterStage.tsx`

**Interfaces:**
- `CharacterState`: union of `idle | wave | running | thinking | curious | happy | confused | frustrated | reading | celebrating | disappointed | shopping`.
- `CharacterEvent`: typed user action or development preview event that the controller maps to a character state.
- `StudyQuestCharacter({ state, dialogue, reducedMotion, onInteraction })`: accessible, reusable character display.
- `dispatchCharacterEvent(event, restingState)`: returns the next state and an optional duration/return state; it has no knowledge of backend calls.

- [x] Define the state and event types, including explicit preview-only success/failure events.
- [x] Map each state to one inspected pose crop and a caption stating when the pose is exact, reused, or animated.
- [x] Implement browser Canvas cropping with border-connected pale-background removal and preserve the original pixel resolution.
- [x] Implement the centralized state controller, transient reaction expiry, and cleanup when state changes.
- [x] Render the sprite with nearest-neighbor scaling and non-blocking click/hover interaction.
- [x] Inspect all twelve states on the stage; adjust crop bounds until no board labels or unrelated artwork remain.

### Task 3: Add the state inspector and development preview controls

**Files:**
- Create: `src/character/StateInspector.tsx`
- Create: `src/character/PreviewControls.tsx`
- Create: `src/character/useInactivityNudge.ts`
- Modify: `src/App.tsx`, `src/styles.css`

**Interfaces:**
- `StateInspector({ selectedState, onSelect })`: keyboard-operable list of the twelve planned states.
- `PreviewControls({ onEvent })`: development-only controls for answer selection, correct/incorrect result, processing success/failure, purchase result, pause, and reset.
- `useInactivityNudge({ active, paused, questionKey, enabled, onNudge })`: managed inactivity timer with visibility and cleanup behavior.

- [x] Add the twelve-state inspector with a visible state description and source-pose note.
- [x] Add clearly labeled simulation buttons; keep reward values out of the animation layer.
- [x] Add the unanswered-question inactivity sequence and stop/reset rules.
- [x] Add reduced-motion and nudge enable/disable controls; default the nudge preference from the browser setting.
- [x] Complete responsive layout, focus states, and concise guidance copy.
- [x] Inspect all twelve states, direct interactions, inactivity lifecycle, reduced-motion mode, and mobile layout in the running preview. Desktop live inspection remains outstanding (noted above).

### Task 4: Write usage and asset limitation notes

**Files:**
- Create: `docs/character-preview.md`
- Modify: `docs/superpowers/plans/2026-11-12-studyquest-character-lab.md`

- [x] Document the preview route, how to select states, how to use preview controls, and which poses reuse art or use motion.
- [x] Record the visual inspection performed and any known limitations without claiming unrun automated checks.
- [x] Confirm the plan's file list matches the delivered implementation.

---

### User-requested correction: Character crop and motion quality (2026-11-13)

**Reason:** The user reported visible character bugs and asked for smoother movement across every emotion. Review of the original brief confirmed that Phase 1 acceptance requires transitions without broken frames or inconsistent proportions. The previous implementation did not meet that criterion.

**Files:**
- Modify: `src/character/artwork.ts`, `src/character/cropArtwork.ts`, `src/character/StudyQuestCharacter.tsx`, `src/App.tsx`, `src/character/PreviewControls.tsx`, `src/styles.css`
- Create: `src/character/useCharacterMotion.ts`
- Modify: `docs/character-preview.md`, this plan, and the approved design addendum

- [x] Correct the clipped Idle pose bounds and preserve each pose's aspect ratio inside a stable bottom-anchored frame.
- [x] Keep the existing pose visible while the next crop loads; crossfade image layers instead of showing a loading placeholder between states.
- [x] Add cleaned-up GSAP motion timelines for all twelve state labels, with motion separated from pose-swap transforms.
- [x] Keep reduced motion enabled by default when requested by the device, while allowing an explicit preview-only override.
- [x] Recheck the character against the supplied reference and verify state changes, reduced-motion behavior, and a fresh production build.
