# StudyQuest Phase 2 UI Design

**Date:** 2026-11-13  
**Status:** Approved by the user's instruction to proceed to Phase 2  
**Scope:** Responsive public pages and student application shell; UI only

## Intent

Expand the Phase 1 character lab into the Phase 2 StudyQuest website shell while
preserving the supplied protagonist and pixel-art direction. Give students a
clear landing page, sign-in and registration layouts, a navigable dashboard,
and prepared layouts for the next product areas.

## Goals

- Provide working routes for `/`, `/login`, `/register`, `/app`, the student
  placeholder pages, and `/character-lab`.
- Include clearly labeled dashboard examples of empty and loading states.
- Reuse the Phase 1 `StudyQuestCharacter` component on the landing page and
  dashboard. Keep the brown-haired student design from the supplied assets.
- Build a responsive sidebar, page header, dashboard, and consistent page
  placeholders that follow the supplied UI mockup.
- Label all sample account values as demo data. Keep account forms local and
  clearly explain they do not create or submit an account.
- Keep controls keyboard-accessible and respect the system reduced-motion
  preference for character movement.

## Non-goals

- Authentication, persistence, uploads, quiz generation or gameplay, reward
  transactions, shopping, or inventory operations.
- Presenting sample figures as real student data.
- Generating or replacing character artwork. Use the existing supplied poses.

## Approaches

1. Leave the character lab at `/` and place the rest of the app behind another
   route. This would omit the Phase 2 landing page requirement.
2. Make `/` the public landing page, provide the student shell under `/app`,
   and keep the Phase 1 lab available at `/character-lab`. **Selected:** it
   covers Phase 2 while preserving the earlier review surface.
3. Add a routing dependency. **Not selected:** this small static preview can
   use direct Vite fallback routes and native links without another package.

## Visual direction

Use the supplied mockup's deep-indigo navigation, sky-blue adventure scene,
lavender surfaces, and gold action accents. Keep system rounded sans-serif text
for readable controls and use crisp pixel art only for the character and small
environment details. The landing page features the existing student on a
floating study island. Desktop uses a fixed sidebar; mobile moves navigation
into a horizontally scrollable, labeled row.

## Data and interaction calls

- Routes use normal path navigation, so browser back/forward and direct route
  loading work without a router dependency.
- Dashboard numbers and the sample name “Alex” are explicitly labeled as demo
  content. Placeholder pages state that their data and actions are not live.
- Login and registration forms show a preview notice on submit; no credentials
  are sent or stored.
- The “Open demo dashboard” action enters `/app` without implying sign-in.
- The `/character-lab` route preserves the Phase 1 review UI.

## Verification

Run the production build and manually inspect the landing, auth, dashboard, a
placeholder route, character lab, and narrow layout. Automated tests are not
added or run under the active session instruction.
