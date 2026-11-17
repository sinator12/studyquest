# StudyQuest Phase 2 UI

Phase 2 adds the public website shell and student application layouts. It is a
front-end preview; no account, study, quiz, reward, purchase, or settings data
is sent to a server or saved.

## Routes

| Route | Screen |
|---|---|
| `/` | Public landing page |
| `/login` | Sign-in screen preview |
| `/register` | Account creation screen preview |
| `/app` | Demo student dashboard |
| `/app/library` | Study library placeholder |
| `/app/quiz` | Quiz placeholder |
| `/app/shop` | Character shop placeholder |
| `/app/inventory` | Inventory placeholder |
| `/app/progress` | Progress placeholder |
| `/app/profile` | Profile placeholder |
| `/app/settings` | Settings placeholder |
| `/character-lab` | Phase 1 character state preview |

Native links handle route changes, browser back/forward, and direct page loads
through Vite's single-page fallback. The student shell has a desktop sidebar
and a labeled, horizontally scrollable mobile navigation row.

## Demo data and limits

The dashboard uses fictional sample data for Alex. The workspace, sample
balance, accuracy, quiz counts, and recent activity are labeled as examples.
The login and registration forms show a local preview notice and do not submit
or store field values. Placeholder pages describe their future purpose without
showing fake records or enabling fake actions.

The dashboard also includes static, explicitly labeled empty and loading
examples so the layouts can be reviewed before any real data service exists.

Authentication and persistence, material uploads, quiz generation and
gameplay, scoring, coin rewards, purchases, inventory, and saved preferences
remain outside this phase. The landing page and dashboard reuse the supplied
StudyQuest student through the Phase 1 `StudyQuestCharacter` component; no new
character image was introduced.

## Visual and interaction notes

The shell follows the supplied mockup's indigo navigation, blue adventure
scene, lavender surfaces, and gold primary actions. Pixel art stays crisp. The
character reads the system reduced-motion setting. The character lab remains
available at `/character-lab`.
