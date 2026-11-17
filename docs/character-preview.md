# StudyQuest character preview

The character lab is available at `/character-lab` when the local Vite server is running. The site home at `/` is the Phase 2 landing page.

```powershell
npm install
npm run dev
```

Select any state in the inspector. Clicking the character triggers a short
wave; hovering gives a quiet shadow cue without changing its current state.
The development-only controls simulate question, processing, and shop outcomes;
they do not call a backend, award coins, or make purchases.

## Inactivity preview

Choose **Start quiet question** to begin an unanswered-question preview. The
character starts in `thinking`. If gentle inactivity nudges are enabled, it
looks around after 10 seconds, taps a foot after 20 seconds, shows mild
confusion after 30 seconds, and shows mild frustration after 45 seconds before
returning to the selected inspector state. Selecting an answer, changing the
question, pausing, or hiding the page stops and resets the timer. The nudge can
be switched off at any time.

The motion setting defaults to the device's reduced-motion preference. The
preview control can override that default for this page so the animation can be
inspected; it does not change the device setting. When reduced motion is on,
pose changes are immediate and character movement is disabled.

## Artwork notes

The source images in `public/assets/references/` are composite concept boards,
not aligned sprite sheets. The app crops individual poses with the browser
Canvas API, removes only light background pixels connected to the crop edge,
and trims transparent padding. A fixed bottom-anchored frame keeps the
character's position stable. State changes crossfade from the previous pose
after the next crop is ready; GSAP motion runs on a separate wrapper so pose
swaps do not interrupt or resize the character. The art remains a crop of a
reference illustration rather than a production sprite.

| State | Source pose | Preview treatment |
|---|---|---|
| Idle | Idle | Supplied pose with gentle breathing; no idle frame sheet |
| Wave | Wave | Supplied pose with smooth whole-body sway; no aligned wave cycle |
| Running | Running | Supplied running pose with a smooth in-place loop; no limb cycle |
| Thinking | Thinking | Supplied pose with a subtle nod |
| Curious | Thinking | Reused pose with an attentive lean |
| Happy | Win | Reused pose with a short bounce |
| Confused | Thinking | Reused pose with a brief tilt |
| Frustrated | Thinking | Reused pose with a restrained foot tap |
| Reading | Reading | Supplied pose with a subtle breath; no page-turn frame |
| Celebrating | Win | Supplied pose with a brief, smooth victory jump |
| Disappointed | Sit | Supplied sit pose for a quiet response |
| Shopping | Idle | Reused pose with a small look toward the shop preview |

`StudyQuest` appears as text in the preview header. The package includes a
composite brand board rather than a standalone logo file, so that board remains
reference material instead of being presented as a cropped production logo.

## Scope and checks

This preview implements the character system only. Authentication, uploads,
quiz generation, real answer grading, rewards, purchases, and inventory are not
connected. No animation frames were invented: poses without a matching supplied
frame use a documented full-body movement over a verified pose. Automated
tests were not added or run. The local preview and production build were
inspected during implementation.
