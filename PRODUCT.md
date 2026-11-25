# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students and self-learners preparing for exams, quizzes, and class reviews across desktop and mobile browsers, including first-time visitors trying the product in Demo Mode before signing in.

## Product Purpose

EduQuest turns uploaded study documents (PDF, DOCX, PPTX, XLSX, TXT, Markdown), pasted notes, and typed topics into interactive study explanations, structured 3-day study plans, and active-recall arcade games (Study Café and Bingo Night).

## Positioning

Instead of passive flashcard reading, EduQuest extracts real concepts from a learner's own material and feeds them directly into playable games (Study Café order-serving and Bingo Night 5x5 card stamping), paired with an AI Explainer and Study Plan generator.

## Operating Context

- Learners switch between four core workspaces: Dashboard (upload/paste/topic question generator & saved library), Study Plan (4-step exam planner), Explain (step-by-step concept explainer + quick-check quiz), and Games (Study Café and Bingo Night).
- Mobile and desktop browsers are first-class targets; top navigation on desktop collapses to a bottom bar on mobile viewports.

## Capabilities and Constraints

- Client-side React + Vite SPA (`src/App.tsx`) with optional Supabase Google OAuth + progress sync (`src/site/supabaseClient.ts`) and optional Groq/Gemini/OpenAI API keys plus a built-in offline NLP/explainer fallback (`src/site/aiService.ts`).
- Document parsing must extract actual text inside binary/compressed formats (`.pdf`, `.docx`, `.pptx`, `.xlsx`, `.rtf`, plain text) rather than reading only filenames or raw compressed headers.
- Question generation must produce varied, non-cycling questions grounded in the material and support generating fresh question sets when a questionnaire finishes or repeats.
- Angry Nerds and the disabled "Host a night" card in Bingo Night are removed.
- Line Bingo must reliably detect and award wins on any completed row, column, or diagonal.
- Demo Mode (Balanced Preview) allows unauthenticated users to explore Study Café (5 Qs), Line Bingo, and up to 2 topic/text generations (5 Qs max) and 2 AI Explains, while locking file upload, Study Plans, Full Card Bingo, and XP/streak/library persistence behind Google Sign-In.

## Brand Commitments

- Product name: EduQuest ("Study. Play. Level up.")
- Visual design system: PostHog (`awesome-design-md/design-md/posthog/DESIGN.md`) — warm cream paper canvas (`#eeefe9`), crisp white cards (`#ffffff`), olive-charcoal ink (`#23251d`), olive-gray body (`#4d4f46`), hairline borders (`#bfc1b7` / `#dcdfd2`), and saturated amber-gold (`#f7a501`) primary CTAs, harmonizing with Study Café and Bingo Night's warm palette while eliminating dark-navy glowing-orb AI-slop.
- Existing game character illustrations (`/games/study-cafe/*.png`, mascot SVG) and game artwork are preserved.

## Evidence on Hand

- Existing client codebase in `src/` and static assets in `public/games/` and `public/assets/`.
- No `.env` cloud AI keys are assumed at runtime; built-in document extraction and local AI generation must work cleanly out of the box alongside optional Groq/Gemini/OpenAI keys.

## Product Principles

1. Real document understanding over title-only guesses.
2. Fresh, non-repetitive active recall across every game and quiz.
3. Tactile, high-contrast warm-paper craft across every viewport, desktop and mobile.
4. Clear boundaries between unauthenticated Demo Mode and full signed-in persistence.
