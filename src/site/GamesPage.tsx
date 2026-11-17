import { useState, useEffect } from "react";
import { CATEGORIES, GAMES, POPULAR_SLUGS, FILTER_TABS, type Game } from "./gamesData";
import { getActiveDeck, type DeckInfo } from "./studyStore";
import TopNav from "./TopNav";
import "./games.css";

/* ------------------------------------------------------------------ */
/*  Helper: inline SVG icons (Lucide-style)                           */
/* ------------------------------------------------------------------ */

function IconSearch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconChevronRight({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function IconStar({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="#FFC245" stroke="#FFC245" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconUsers({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  GameCard                                                           */
/* ------------------------------------------------------------------ */

function GameCard({ game, rank }: { game: Game; rank?: number }) {
  return (
    <article className={`sqg-card${game.isLocked ? " is-locked" : ""}`}>
      <div className="sqg-pic-wrap">
        {rank && <span className="sqg-rank">{rank}</span>}
        <div className="sqg-pic">
          <img src={game.image} alt={`${game.name} gameplay`} loading="lazy" />
        </div>
        {game.multiplayer && (
          <div className="sqg-tags">
            <span className="sqg-tag sqg-tag-mp">
              <IconUsers size={14} />
              Multiplayer
            </span>
          </div>
        )}
      </div>
      <h3>{game.name}</h3>
      {game.description && <p className="sqg-sub">{game.description}</p>}
      {game.rating && (
        <div className="sqg-meta">
          <IconStar size={14} />
          <b>{game.rating}</b>
          {game.ratingCount && <span>({game.ratingCount})</span>}
        </div>
      )}
      <a href={`/games/${game.slug}`} className="sqg-hit">
        <span className="sr-only">{game.name}</span>
      </a>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  FeaturedCard                                                       */
/* ------------------------------------------------------------------ */

function FeaturedCard({ game, rank, onHowItWorks }: { game: Game; rank: number; onHowItWorks?: () => void }) {
  return (
    <article className="sqg-feature">
      <span className="sqg-rank">{rank}</span>
      <div className="sqg-f-pic">
        <img src={game.image} alt={`${game.name} gameplay`} loading="lazy" />
      </div>
      <div className="sqg-f-body">
        <h3>{game.name}</h3>
        {game.description && <p>{game.description}</p>}
        <div className="sqg-f-row">
          {game.multiplayer && (
            <span className="sqg-tag sqg-tag-mp">
              <IconUsers size={12} />
              Multiplayer
            </span>
          )}
          {game.rating && (
            <div className="sqg-meta">
              <IconStar size={13} />
              <b>{game.rating}</b>
              {game.ratingCount && <span>({game.ratingCount})</span>}
            </div>
          )}
        </div>
        <div className="sqg-f-cta">
          <a href={`/games/${game.slug}`} className="sqh-btn sqh-btn-primary" style={{ textDecoration: 'none' }}>Play Now</a>
          <button
            type="button"
            className="sqh-btn sqh-btn-ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onHowItWorks?.();
            }}
          >
            How It Works
          </button>
        </div>
      </div>
      <a href={`/games/${game.slug}`} className="sqg-hit">
        <span className="sr-only">{game.name}</span>
      </a>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  CategoryToken (colored circle icon used in section headers)        */
/* ------------------------------------------------------------------ */

function CategoryToken({ color }: { color: string }) {
  return (
    <svg
      className="sqh-art sqg-token"
      viewBox="0 0 52 52"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable={false}
    >
      <circle className="drop" cx="29" cy="30" r="21" />
      <circle className="ol" cx="26" cy="26" r="21" fill={color} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function GamesPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDeck, setActiveDeckState] = useState<DeckInfo>(getActiveDeck());
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setActiveDeckState(getActiveDeck());
    window.addEventListener("sq_deck_updated", handleUpdate);
    return () => window.removeEventListener("sq_deck_updated", handleUpdate);
  }, []);

  const handleSurpriseMe = () => {
    const randomGame = GAMES[Math.floor(Math.random() * GAMES.length)];
    if (randomGame) {
      window.location.href = `/games/${randomGame.slug}`;
    }
  };

  /* ----- Filtering logic ----- */

  const isFiltered = activeFilter !== "all" || searchQuery.trim() !== "";

  const filteredGames = GAMES.filter((g) => {
    // Search filter
    if (searchQuery.trim() !== "") {
      if (!g.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) {
        return false;
      }
    }

    // Tab filter
    if (activeFilter === "all") return true;
    if (activeFilter === "friends") return g.multiplayer === true;
    if (activeFilter === "quick" || activeFilter === "deep") return true;

    // Category slug filter
    return g.category === activeFilter;
  });

  /* ----- Popular games (top 6) ----- */

  const popularGames = POPULAR_SLUGS.map((slug) =>
    GAMES.find((g) => g.slug === slug)
  ).filter((g): g is Game => g != null);

  const featuredGame = popularGames[0];
  const popularRest = popularGames.slice(1, 6);

  /* ----- A-Z index ----- */

  const azGames = [...GAMES].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  const azGroups: Record<string, Game[]> = {};
  for (const g of azGames) {
    const letter = g.name[0].toUpperCase();
    if (!azGroups[letter]) azGroups[letter] = [];
    azGroups[letter].push(g);
  }

  const sortedLetters = Object.keys(azGroups).sort();

  /* ----- Category color lookup ----- */

  function getCategoryColor(categorySlug: string | undefined): string {
    if (!categorySlug) return "#1B1147";
    const cat = CATEGORIES.find((c) => c.slug === categorySlug);
    return cat?.color ?? "#1B1147";
  }

  /* ---------------------------------------------------------------- */

  return (
    <div className="sqh sqg">
      {/* ---- SVG gradient defs ---- */}
      <div aria-hidden="true">
        <svg
          className="sqh-art"
          width="0"
          height="0"
          style={{ position: "absolute" }}
          aria-hidden="true"
          focusable={false}
        >
          <defs>
            <linearGradient id="sq-purple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9166F2" />
              <stop offset="1" stopColor="#7647E2" />
            </linearGradient>
            <linearGradient id="sq-orange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFC245" />
              <stop offset="1" stopColor="#FFA21C" />
            </linearGradient>
            <linearGradient id="sq-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5BBEFF" />
              <stop offset="1" stopColor="#C4ECFF" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ---- Header / Nav ---- */}
      <TopNav activeTab="games" />

      {/* ---- Main content ---- */}
      <main className="sqg-body">
        {/* Hero */}
        <section className="sqg-top">
          <div className="sqh-wrap">
            <div>
              <div className="sqg-crumbs">
                <nav aria-label="Breadcrumb">
                  <ol
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "6px",
                      listStyle: "none",
                      margin: 0,
                      padding: 0,
                      fontSize: "14px",
                      color: "var(--sq-ink-3)",
                    }}
                  >
                    <li
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <a
                        href="/"
                        style={{
                          textDecoration: "underline",
                          textUnderlineOffset: "3px",
                        }}
                      >
                        Home
                      </a>
                    </li>
                    <li
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <IconChevronRight size={14} />
                      <span
                        aria-current="page"
                        style={{ color: "var(--sq-ink-2)" }}
                      >
                        Games
                      </span>
                    </li>
                  </ol>
                </nav>
              </div>
              <h1>Choose Study Game</h1>
              <p className="sqg-lede">
                Pick a game to play with your study material
              </p>
              <div className="sqg-top-actions">
                <button
                  type="button"
                  className="sqh-btn sqh-btn-primary"
                  onClick={handleSurpriseMe}
                >
                  🎲 Surprise me
                </button>
                <a
                  href="/dashboard"
                  className="sqh-btn sqh-btn-ghost sqh-btn-sm"
                >
                  ✨ Create your own game
                </a>

                {/* Video frame 015 pill: questions ready */}
                {activeDeck && activeDeck.questions.length > 0 && (
                  <a
                    href="/dashboard"
                    className="sq-material-pill"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "rgba(52, 211, 153, 0.15)",
                      border: "1.5px solid rgba(52, 211, 153, 0.4)",
                      padding: "8px 16px",
                      borderRadius: "999px",
                      color: "#FFFFFF",
                      fontSize: "14px",
                      fontWeight: 800,
                      textDecoration: "none"
                    }}
                  >
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34D399" }} />
                    <span>{activeDeck.questions.length} questions ready</span>
                    <span style={{ color: "#6EE7B7", textDecoration: "underline", marginLeft: "4px" }}>
                      Replace material
                    </span>
                  </a>
                )}
              </div>
            </div>
            <div className="sqg-top-art" aria-hidden="true">
              <svg
                className="sqh-art"
                viewBox="0 0 440 300"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable={false}
              >
                <circle className="stage" cx="220" cy="170" r="128" />
                <circle
                  className="ring"
                  cx="220"
                  cy="170"
                  r="156"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="0.1 14"
                />
                <ellipse className="ground" cx="220" cy="286" rx="78" ry="8" />
                <text
                  x="220"
                  y="175"
                  textAnchor="middle"
                  fill="var(--sq-ink)"
                  fontSize="48"
                  fontWeight="900"
                  fontFamily="var(--sq-display)"
                >
                  🎮
                </text>
              </svg>
            </div>
          </div>
        </section>

        {/* Filter / search bar */}
        <div className="sqg-bar">
          <div className="sqh-wrap">
            <div className="sqg-bar-row">
              <label className="sqg-search">
                <IconSearch />
                <input
                  type="search"
                  placeholder="Search games..."
                  aria-label="Search games by name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </label>
              <div className="sqg-rail" role="group" aria-label="Filter games">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className="sqg-pick"
                    aria-pressed={activeFilter === tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                  >
                    <span className="sqg-pick-token" aria-hidden="true">
                      <svg
                        className="sqh-art sqg-token"
                        viewBox="0 0 52 52"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        focusable={false}
                      >
                        <circle className="drop" cx="29" cy="30" r="21" />
                        <circle
                          className="ol"
                          cx="26"
                          cy="26"
                          r="21"
                          fill={tab.color || "#1B1147"}
                        />
                      </svg>
                    </span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ---- Filtered results (flat grid) ---- */}
        {isFiltered && (
          <section className="sqg-block">
            <div className="sqh-wrap">
              <div className="sqg-block-head">
                <div>
                  <div className="sqg-h">
                    <h2>
                      {searchQuery.trim()
                        ? `Results for "${searchQuery.trim()}"`
                        : "Filtered Games"}
                    </h2>
                    <span className="sqg-count">{filteredGames.length}</span>
                  </div>
                </div>
              </div>
              {filteredGames.length > 0 ? (
                <div className="sqg-pop-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gridAutoFlow: 'unset' }}>
                  {filteredGames.map((game) => (
                    <GameCard key={game.slug} game={game} />
                  ))}
                </div>
              ) : (
                <p style={{ padding: "2rem 0", color: "var(--sq-ink-3)" }}>
                  No games found. Try a different search or filter.
                </p>
              )}
            </div>
          </section>
        )}

        {/* ---- Popular section (only when unfiltered) ---- */}
        {!isFiltered && featuredGame && (
          <section className="sqg-block" aria-label="Most popular">
            <div className="sqh-wrap">
              <div className="sqg-block-head">
                <div className="sqg-head-token" aria-hidden="true">
                  <svg className="sqh-art sqg-token" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable={false}>
                    <circle className="drop" cx="29" cy="30" r="21" />
                    <circle className="ol" cx="26" cy="26" r="21" fill="#FFA826" />
                    <g transform="translate(26,26)">
                      <path fill="#fff" d="M -12,7 L -14,-7 L -6.5,-1 L 0,-10 L 6.5,-1 L 14,-7 L 12,7 Z" />
                      <rect x="-12" y="9" width="24" height="4" rx="2" fill="#fff" />
                    </g>
                  </svg>
                </div>
                <div>
                  <h2>Most popular</h2>
                  <p>The games students rate highest and play most.</p>
                </div>
              </div>
              <div className="sqg-pop">
                <FeaturedCard game={featuredGame} rank={1} onHowItWorks={() => setShowHowItWorks(true)} />
                <div className="sqg-pop-grid">
                  {popularRest.map((game, i) => (
                    <GameCard key={game.slug} game={game} rank={i + 2} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ---- Category sections (only when unfiltered) ---- */}
        {!isFiltered &&
          CATEGORIES.map((cat) => {
            const catGames = GAMES.filter((g) => g.category === cat.slug);
            if (catGames.length === 0) return null;
            return (
              <section key={cat.slug} className="sqg-block">
                <div className="sqh-wrap">
                  <div className="sqg-block-head">
                    <span className="sqg-head-token" aria-hidden="true">
                      <CategoryToken color={cat.color} />
                    </span>
                    <div>
                      <h2>{cat.label}</h2>
                      {cat.description && (
                        <p>{cat.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="sqg-row">
                    {catGames.map((game) => (
                      <GameCard key={game.slug} game={game} />
                    ))}
                  </div>
                </div>
              </section>
            );
          })}

        {/* ---- A-Z index section ---- */}
        {!isFiltered && (
          <section className="sqg-az-block" aria-label="All games A to Z">
            <div className="sqh-wrap">
              <div className="sqg-block-head">
                <div className="sqg-head-token" aria-hidden="true">
                  <svg className="sqh-art sqg-token" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable={false}>
                    <circle className="drop" cx="29" cy="30" r="21" />
                    <circle className="ol" cx="26" cy="26" r="21" fill="#1B1147" />
                    <g transform="translate(26,26)" fill="#fff">
                      <rect x="-11" y="-11" width="9" height="9" rx="2.5" />
                      <rect x="2" y="-11" width="9" height="9" rx="2.5" />
                      <rect x="-11" y="2" width="9" height="9" rx="2.5" />
                      <rect x="2" y="2" width="9" height="9" rx="2.5" />
                    </g>
                  </svg>
                </div>
                <div>
                  <div className="sqg-h">
                    <h2>All games A&nbsp;to&nbsp;Z</h2>
                    <span className="sqg-count">{GAMES.length}</span>
                  </div>
                </div>
              </div>

              {/* Color legend */}
              <div className="sqg-legend">
                {CATEGORIES.map((cat) => (
                  <span key={cat.slug}>
                    <i
                      className="sqg-gdot"
                      style={{ background: cat.color }}
                    />
                    {cat.label}
                  </span>
                ))}
              </div>

              {/* A-Z grouped list */}
              <div className="sqg-az">
                {sortedLetters.map((letter) => (
                  <div key={letter} className="sqg-az-group">
                    <div className="sqg-az-letter" aria-hidden="true">{letter}</div>
                    {azGroups[letter].map((game) => (
                      <a key={game.slug} href={`/games/${game.slug}`} className="sqg-az-item">
                        <i
                          className="sqg-gdot"
                          style={{
                            background: getCategoryColor(game.category),
                          }}
                        />
                        {game.name}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ---- Footer ---- */}
      <footer className="sqh sqh-footer">
        <div className="sqh-wrap">
          <div className="sqh-foot">
            <div>
              <img
                src="/assets/studyQuestLogo-18735c9a.svg"
                alt="StudyQuest Logo"
                width={168}
                height={40}
                loading="lazy"
              />
              <p>Interactive learning through engaging games and quizzes.</p>
            </div>
            <div>
              <h3>Product</h3>
              <ul>
                <li>
                  <a href="/games">Games</a>
                </li>
                <li>
                  <a href="/app">Dashboard</a>
                </li>
              </ul>
            </div>
            <div>
              <h3>Popular games</h3>
              <ul>
                {POPULAR_SLUGS.slice(0, 6).map((slug) => {
                  const g = GAMES.find((x) => x.slug === slug);
                  return g ? (
                    <li key={slug}>
                      <a href={`/games/${slug}`}>{g.name}</a>
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
            <div>
              <h3>Company</h3>
              <ul>
                <li>
                  <a href="/about">About Us</a>
                </li>
                <li>
                  <a href="/blog">Blog</a>
                </li>
              </ul>
            </div>
            <div>
              <h3>Legal</h3>
              <ul>
                <li>
                  <a href="/terms">Terms of Service</a>
                </li>
                <li>
                  <a href="/privacy">Privacy Policy</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="sqh-legal">
            <span>© 2026 StudyQuest. All rights reserved.</span>
            <a href="mailto:hello@studyquest.app">hello@studyquest.app</a>
          </div>
        </div>
      </footer>
      {/* ---- How It Works Modal ---- */}
      {showHowItWorks && (
        <div className="sq-modal-overlay" onClick={() => setShowHowItWorks(false)}>
          <div className="sq-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="sq-modal-head">
              <div className="sq-modal-title-row">
                <span className="sq-modal-icon">🎮</span>
                <div>
                  <h3>How StudyQuest Games Work</h3>
                  <p>Turn any study material into an active recall arcade challenge.</p>
                </div>
              </div>
              <button
                type="button"
                className="sq-modal-close-btn"
                onClick={() => setShowHowItWorks(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#0A0F24', padding: 14, borderRadius: 12, border: '1px solid #1E294B' }}>
                <span style={{ fontSize: 24 }}>📝</span>
                <div>
                  <strong style={{ display: 'block', color: '#FFF', fontSize: 14 }}>1. Add Your Notes</strong>
                  <span style={{ color: '#94A3B8', fontSize: 12.5 }}>Upload any file, paste text, or type a topic in the Dashboard.</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#0A0F24', padding: 14, borderRadius: 12, border: '1px solid #1E294B' }}>
                <span style={{ fontSize: 24 }}>☕</span>
                <div>
                  <strong style={{ display: 'block', color: '#FFF', fontSize: 14 }}>2. Study Café</strong>
                  <span style={{ color: '#94A3B8', fontSize: 12.5 }}>Run your café! Customers order items that test your notes. Serve matching drinks to earn stars and cash.</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#0A0F24', padding: 14, borderRadius: 12, border: '1px solid #1E294B' }}>
                <span style={{ fontSize: 24 }}>🎯</span>
                <div>
                  <strong style={{ display: 'block', color: '#FFF', fontSize: 14 }}>3. Angry Nerds</strong>
                  <span style={{ color: '#94A3B8', fontSize: 12.5 }}>Answer questions to load your slingshot with Nerds. Fling them with physics to smash forts and topple Grumps!</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#0A0F24', padding: 14, borderRadius: 12, border: '1px solid #1E294B' }}>
                <span style={{ fontSize: 24 }}>⚡</span>
                <div>
                  <strong style={{ display: 'block', color: '#FFF', fontSize: 14 }}>4. Level Up & Keep Streaks</strong>
                  <span style={{ color: '#94A3B8', fontSize: 12.5 }}>Every correct order, destroyed fort, and 25m Focus session earns XP and keeps your daily streak blazing.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="sq-auth-submit-btn"
              style={{ width: '100%', padding: '12px' }}
              onClick={() => setShowHowItWorks(false)}
            >
              Got it, let's play!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
