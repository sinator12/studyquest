# StudyQuest Character Lab Design

**Date:** 2026-11-12  
**Status:** Approved  
**Scope:** An isolated preview for the main character system

## Intent

StudyQuest is a study companion for senior high school students. The first
usable piece should make its pixel-art protagonist feel consistent and
supportive while giving the team a clear place to inspect reactions before
they are connected to real study flows.

The repository currently has no application source or framework. The supplied
ZIP contains three visual reference boards. They show character poses and
expressions, but they are not clean, aligned, transparent sprite sheets.

## Goals

- Build a responsive, keyboard-friendly character preview with all twelve
  planned states selectable.
- Create a reusable, typed character component and keep event-to-state changes
  in one controller.
- Make preview-only controls explicit; do not imply that quiz, upload, rewards,
  or purchases are connected.
- Respect reduced motion, preserve crisp pixel rendering, and keep the
  character away from primary controls.
- Use supplied artwork where individual poses can be isolated cleanly. Use
  documented motion or a clearly identified static pose when the board
  does not contain usable animation frames.

## Non-goals

- Building the landing page, dashboard, authentication, uploads, quizzes,
  rewards, shop, inventory, database, or AI integrations.
- Claiming the concept boards are production sprite sheets.
- Recreating missing character poses as if they were supplied artwork.

## Constraints and calls

- **Confirmed from project brief:** pixel-art fantasy direction, purple/blue
  foundation, gold reward accents, the protagonist's brown hair, white shirt,
  blue tie, dark pants, blue-and-white shoes, and blue backpack.
- **Confirmed from repository inspection:** there is no existing app code or
  framework to extend.
- **Assistant's implementation call:** use Vite, React, and TypeScript for a
  small isolated preview. This follows the brief's typed component contract
  while keeping the work limited to Phase 1.
- **Asset limitation:** exact states without matching source art will use a
  documented supported pose/motion or remain visibly static. No generated or
  hand-drawn replacement will be presented as supplied art.

## Approaches considered

1. **Static HTML/CSS/JavaScript:** the fastest and smallest preview, but it
   would not provide the typed reusable component contract described in the
   brief.
2. **Vite + React + TypeScript (selected):** adds a small app shell, while
   making the character component and state controller reusable for later
   product work.
3. **Full StudyQuest application:** deferred because authentication, data, quiz,
   and reward features are outside this first character-preview slice.

## Visual direction

### Compact tokens

| Role | Color |
|---|---|
| Night-sky canvas | `#191832` |
| Deep indigo panels | `#29245C` |
| Quest purple | `#6254CF` |
| Clear sky blue | `#70A9FF` |
| Mist-lavender surface | `#E9E7FF` |
| Reward gold | `#FFC64A` |
| Main text | `#24213D` |

Use a readable system sans-serif for controls and dialogue, with a bold,
rounded system face for headings. Keep labels in sentence case and reserve
pixelated treatment for the art and small decorative details. Avoid remote
font dependencies in this standalone preview.

### Layout concept

Keep the canvas left-aligned and the controls grouped by task. At desktop size,
the character stage and state inspector sit side-by-side; on narrow screens,
the stage comes first and the controls move below it.

```text
┌ StudyQuest / Character lab                    Preview only ┐
├─────────────────────────────────────────────────────────────┤
│  ┌──────────── Character stage ────────────┐  ┌ States ───┐ │
│  │      character, platform, dialogue      │  │ 12 states │ │
│  │      selected state and motion           │  │ grouped   │ │
│  └──────────────────────────────────────────┘  └───────────┘ │
│  Preview controls: answer selected · correct · idle nudge   │
│  Reduced motion  ·  Size  ·  Reset to idle                   │
└─────────────────────────────────────────────────────────────┘
```

The memorable element is the character on a small floating study-island
platform. Surrounding controls stay restrained and high-contrast so the preview
reads like a tool for reviewing the companion, not a finished student
dashboard.

## Behavior

The preview exposes `idle`, `wave`, `running`, `thinking`, `curious`, `happy`,
`confused`, `frustrated`, `reading`, `celebrating`, `disappointed`, and
`shopping`. Direct selection stays visible for inspection. A single controller
handles temporary reactions from preview events and returns to the currently
selected state when they finish. Preview buttons may simulate an answer,
processing result, reward, or purchase outcome, but must be labeled as
development controls.

The inactivity nudge applies only while a preview question is unanswered. It
stops when an answer is selected, the question changes, the preview is paused,
or the page is hidden. It never submits answers or penalizes the student.

## Approval boundary

Approval covers the Phase 1 character lab described here. Any later product
screens or real quiz, upload, reward, and purchase flows need separate scope and
review.

## User-requested animation correction — 2026-11-13

The first preview did not satisfy the implementation plan's transition
acceptance criteria: it replaced the crop after clearing the current image,
allowed pose bounds to change the character's width, and had no between-state
transition. The Idle crop also omitted part of the supplied figure.

For this correction, keep the supplied poses, use a fixed bottom-anchored frame,
keep the outgoing pose visible while the next crop loads, and crossfade poses
while a separate motion layer runs a small, state-specific GSAP timeline for
each of the twelve states. Preserve the system reduced-motion preference as
the default; let the preview's own control explicitly override that default so
the user can inspect motion. Do not draw or claim new sprite frames.
