# StudyQuest Phase 2 Product UI Implementation Plan

> **For agentic workers:** Execute this plan task-by-task in the current session. Automated tests are not added or run under the active session instruction.

**Goal:** Build the responsive Phase 2 public landing, auth layouts, student shell, dashboard, and placeholder routes while retaining the character lab.

**Architecture:** Keep the existing Vite/React app and introduce a small path-based route switch using normal browser navigation and Vite's SPA fallback. Split public pages, student shell, demo content, and site styles into focused modules; preserve the existing character lab as `/character-lab`.

**Tech Stack:** Vite, React, TypeScript, existing GSAP character system, CSS.

**Spec:** `docs/superpowers/specs/2026-11-13-studyquest-phase-2-ui-design.md`

## Global Constraints

- Preserve the supplied protagonist's brown hair, white shirt, blue tie, dark pants, blue-and-white shoes, and blue backpack.
- Keep pixel art crisp and respect reduced-motion preference.
- Keep mock data clearly marked and do not imply backend functionality.
- Do not implement features from Phases 3–8.
- Do not add or run automated tests under the active session instruction.

## Review Focus

- Directly loading every route must render the intended screen; no route may silently show the wrong page.
- Auth forms must never transmit or persist entered data.
- Dashboard sample figures must remain clearly labeled as demo content.
- Mobile navigation and long labels must stay visible and reachable.
- The character must use the existing Phase 1 asset component and stay within its stage.

---

### Task 1: Preserve the lab and add public routes

**Files:**
- Move/modify: `src/App.tsx` → `src/character/CharacterLab.tsx`
- Create: `src/App.tsx`, `src/site/SiteApp.tsx`, `src/site/PublicPages.tsx`
- Modify: `index.html`

**Interfaces:**
- `CharacterLab` remains the Phase 1 review UI.
- `SiteApp` chooses landing, login, registration, student app, or not-found by `window.location.pathname`.
- Public pages accept no server/auth dependency.

- [x] Preserve `/character-lab`; make `/` the public landing route.
- [x] Add `/login` and `/register` UI with local-only preview notices on submit.
- [x] Set the document title and description for StudyQuest.
- [x] Verify direct route loading and production build.

### Task 2: Build the student shell and dashboard

**Files:**
- Create: `src/site/StudentApp.tsx`, `src/site/demoData.ts`, `src/site/icons.tsx`
- Modify: `src/site/SiteApp.tsx`

**Interfaces:**
- `StudentApp({ pathname })` renders a shared shell and selects the dashboard or a placeholder screen.
- `demoData.ts` owns all sample account values and labels them as sample content.
- Navigation uses native anchors for browser history and direct paths.

- [x] Add desktop sidebar and responsive mobile navigation.
- [x] Add the demo dashboard with sample label, progress cards, recent activity, quick actions, empty/loading state examples, and the supplied StudyQuest character.
- [x] Add a clear preview indicator and no-op account/logout affordances.
- [x] Verify dashboard and navigation in the browser.

### Task 3: Add student placeholder pages and responsive styling

**Files:**
- Modify: `src/site/StudentApp.tsx`
- Create: `src/site/site.css`
- Modify: `src/App.tsx`

**Interfaces:**
- Placeholder routes: `/app/library`, `/app/quiz`, `/app/shop`, `/app/inventory`, `/app/progress`, `/app/profile`, `/app/settings`.
- Each placeholder communicates that its content/actions are not live.

- [x] Add consistent placeholders with route-specific copy and return/next-step links.
- [x] Add the StudyQuest tokens, landing scene, shell, form, dashboard, and mobile layouts.
- [x] Review the library, quiz, shop, inventory, progress, profile, and settings routes; inspect tablet/phone layouts and supplied character rendering.

### Task 4: Update Phase 2 documentation and final verification

**Files:**
- Modify: `docs/character-preview.md`
- Create: `docs/studyquest-phase-2.md`
- Modify: this plan and `.superpowers/sdd/2026-11-13-studyquest-phase-2-product-ui/progress.md`

- [x] Document the routes, demo-only behavior, and deferred real account/data features.
- [x] Run `npm run build` and record its actual result (`npm run build` → passed; TypeScript check and Vite production build, 40 modules transformed).
- [x] Manually review the landing, login, register, dashboard, placeholder, character lab, and mobile navigation.
- [x] Complete a read-only code review; improve small dashboard copy contrast and size, and align phone navigation to the scrollable-row spec.
- [x] Report files, verification, and known limits; request Phase 2 approval before Phase 3.
