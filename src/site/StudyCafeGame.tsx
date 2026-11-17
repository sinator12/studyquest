import { useState, useEffect, useRef } from "react";
import TopNav from "./TopNav";
import { getActiveDeck, updatePlayerStats, recordActivityToday, type DeckInfo } from "./studyStore";
import { type Question } from "./quizData";
import "./studyCafe.css";

interface Customer {
  id: string;
  name: string;
  title: string;
  avatarType: "turtle" | "owl" | "rabbit" | "cat" | "fox";
  greeting: string;
  praise: string;
}

const REGULARS: Customer[] = [
  {
    id: "tully",
    name: "Grandpa Tully",
    title: "ARCHIVIST",
    avatarType: "turtle",
    greeting: "Good morning! My usual order comes with a question from your notes...",
    praise: "Splendid! That's precisely what I ordered. Exquisite brewing!"
  },
  {
    id: "finch",
    name: "Corporal Finch",
    title: "RADIO OPERATOR",
    avatarType: "owl",
    greeting: "Hoo-ray! I need a strong brew to keep the radio frequencies aligned.",
    praise: "Sharp as a tack! Perfect order. Over and out!"
  },
  {
    id: "dash",
    name: "Dash Hops",
    title: "COURIER",
    avatarType: "rabbit",
    greeting: "Quick delivery rush today! Need my brain fueled with this order.",
    praise: "Boom! Fast, delicious, and 100% correct. You rock!"
  },
  {
    id: "nyla",
    name: "Nurse Nyla",
    title: "NIGHT NURSE",
    avatarType: "cat",
    greeting: "Just coming off a long shift at the ward. Here is my order...",
    praise: "Purr-fect! Just what the doctor ordered. Thank you, barista!"
  },
  {
    id: "pip",
    name: "Pip",
    title: "STUDENT FOX",
    avatarType: "fox",
    greeting: "Big exam coming up! Studying these notes while I wait for coffee.",
    praise: "Yay! That matches my study guide exactly! Thanks!"
  }
];

const DRINK_ICONS = [
  // 0: Tall layered iced latte
  "tall-latte",
  // 1: Classic coffee cup
  "mug",
  // 2: Cappuccino with saucer
  "saucer",
  // 3: Iced drink with straw
  "iced-straw"
];

export default function StudyCafeGame() {
  const [deck, setDeck] = useState<DeckInfo>(getActiveDeck());
  const [questions, setQuestions] = useState<Question[]>(deck.questions);
  const [phase, setPhase] = useState<"intro" | "opening" | "cafe" | "summary">("intro");

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [customerIndex, setCustomerIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // Cafe economy
  const [cashEarned, setCashEarned] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const [customersServed, setCustomersServed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [chalkboardTip, setChalkboardTip] = useState(
    "Here comes our first regular. Their order is a question from your notes."
  );

  const [servingAnim, setServingAnim] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const currentCustomer = REGULARS[customerIndex % REGULARS.length];
  const currentQ = questions[currentQIndex % questions.length];

  // Refresh deck if updated
  useEffect(() => {
    const d = getActiveDeck();
    setDeck(d);
    setQuestions(d.questions);
  }, []);

  const handleStartGame = (useSample = false) => {
    if (useSample) {
      // Use fallback
      const sample = getActiveDeck();
      setQuestions(sample.questions);
    }
    setPhase("opening");
    setTimeout(() => {
      setPhase("cafe");
      setCurrentQIndex(0);
      setCustomerIndex(0);
      setCashEarned(0);
      setStarsEarned(0);
      setCustomersServed(0);
      setStreak(0);
      setChalkboardTip("Here comes our first regular. Their order is a question from your notes.");
    }, 1800);
  };

  const handleSelectMenuItem = (optionIdx: number) => {
    if (isAnswerRevealed || !currentQ) return;

    setSelectedAnswer(optionIdx);
    setIsAnswerRevealed(true);
    const isCorrect = optionIdx === currentQ.correctIndex;

    if (isCorrect) {
      setServingAnim(true);
      const earned = 15;
      setCashEarned(c => c + earned);
      setStarsEarned(s => s + 1);
      setCustomersServed(n => n + 1);
      setStreak(st => st + 1);
      updatePlayerStats({ coins: earned, stars: 1 });
      recordActivityToday("Study Café Order Served", 15);
      setChalkboardTip("Get the order right and you'll earn a star and money for the till!");

      setTimeout(() => {
        setServingAnim(false);
        setIsAnswerRevealed(false);
        setSelectedAnswer(null);

        if (currentQIndex + 1 >= Math.min(questions.length, 12)) {
          setPhase("summary");
        } else {
          setCurrentQIndex(i => i + 1);
          setCustomerIndex(c => c + 1);
          setChalkboardTip("Every item on the menu is a possible answer. Tap the one that answers the order.");
        }
      }, 1600);
    } else {
      setStreak(0);
      setChalkboardTip(`Order mix-up! The correct item was: "${currentQ.options[currentQ.correctIndex]}".`);
      setTimeout(() => {
        setIsAnswerRevealed(false);
        setSelectedAnswer(null);
        if (currentQIndex + 1 >= Math.min(questions.length, 12)) {
          setPhase("summary");
        } else {
          setCurrentQIndex(i => i + 1);
          setCustomerIndex(c => c + 1);
        }
      }, 2000);
    }
  };

  return (
    <div className="sq-cafe-app">
      <TopNav activeTab="games" />

      {/* ---------------- INTRO SCREEN ---------------- */}
      {phase === "intro" && (
        <main className="sq-cafe-intro-wrap">
          <div className="sq-cafe-crumbs">
            <a href="/">Home</a> <span>›</span> <a href="/games">Games</a> <span>›</span> <strong>Study Café</strong>
          </div>

          <div className="sq-cafe-hero-grid">
            <div className="sq-cafe-copy">
              <h1>Study Café: A Cozy Coffee Shop Built From Your Notes</h1>
              <p className="sq-cafe-lede">
                Run a café where each order is a question from your study notes. Serve the matching menu item to earn stars and money, then pay the rent and decide what to buy for the café.
              </p>

              <div className="sq-cafe-rating-row">
                <span className="sq-cafe-stars">★★★★★</span>
                <strong>4.63 / 5</strong>
                <span>(961 reviews)</span>
              </div>

              <div className="sq-cafe-badges-row">
                <span className="sq-cafe-badge blue">👥 Multiplayer</span>
                <span className="sq-cafe-badge orange">Café / Quiz</span>
                <span className="sq-cafe-badge dark">1-40 Players</span>
                <span className="sq-cafe-badge dark">Relaxed</span>
              </div>

              <div className="sq-cafe-cta-row">
                <button
                  type="button"
                  className="sq-cafe-btn-play"
                  onClick={() => handleStartGame(false)}
                >
                  <span className="sq-btn-upload-icon">↑</span>
                  <span>Play Study Café</span>
                </button>

                <button
                  type="button"
                  className="sq-cafe-btn-sample"
                  onClick={() => handleStartGame(true)}
                >
                  <span>▶ Try with sample questions</span>
                </button>
              </div>

              <div className="sq-cafe-deck-status">
                <span className="sq-green-circle" />
                <span>Active deck: <strong>{deck.title}</strong> ({deck.questions.length} questions)</span>
                <a href="/dashboard">Change notes</a>
              </div>
            </div>

            {/* Cozy preview art card */}
            <div className="sq-cafe-preview-card">
              <div className="sq-cafe-card-inner">
                <img
                  src="/games/study-cafe.webp"
                  alt="Study Cafe Key Art"
                  className="sq-cafe-art-img"
                  onError={(e) => {
                    // Fallback to illustration if webp unavailable
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <button
                  type="button"
                  className="sq-cafe-float-play-btn"
                  onClick={() => handleStartGame(false)}
                >
                  ▶ Try with sample questions
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ---------------- OPENING TRANSITION ---------------- */}
      {phase === "opening" && (
        <div className="sq-cafe-opening-screen">
          <div className="sq-barista-opening">
            {/* Cute capybara barista SVG */}
            <svg viewBox="0 0 160 160" width="130" height="130">
              {/* Ears */}
              <circle cx="50" cy="46" r="12" fill="#8C5C38" />
              <circle cx="110" cy="46" r="12" fill="#8C5C38" />
              {/* Head */}
              <ellipse cx="80" cy="74" rx="42" ry="38" fill="#B27A4E" />
              {/* Snout */}
              <ellipse cx="80" cy="86" rx="26" ry="20" fill="#CD9B6D" />
              <ellipse cx="73" cy="82" rx="4" ry="5" fill="#3D2111" />
              <ellipse cx="87" cy="82" rx="4" ry="5" fill="#3D2111" />
              <path d="M76 96Q80 99 84 96" stroke="#3D2111" strokeWidth="2.5" strokeLinecap="round" />
              {/* Glasses */}
              <circle cx="66" cy="68" r="11" fill="none" stroke="#2B180A" strokeWidth="3" />
              <circle cx="94" cy="68" r="11" fill="none" stroke="#2B180A" strokeWidth="3" />
              <line x1="77" y1="68" x2="83" y2="68" stroke="#2B180A" strokeWidth="3" />
              {/* Apron & Coffee Cup */}
              <path d="M48 110L112 110L106 150L54 150Z" fill="#F4EBD9" stroke="#3D2111" strokeWidth="2.5" />
              <rect x="68" y="120" width="24" height="22" rx="4" fill="#E26D5C" />
              <path d="M92 125C96 125 97 133 92 135" stroke="#E26D5C" strokeWidth="3" fill="none" />
            </svg>
            <h2>Opening the café...</h2>
            <p>Brewing fresh coffee and writing out today's question menu</p>
          </div>
        </div>
      )}

      {/* ---------------- ACTIVE CAFE GAMEPLAY ---------------- */}
      {phase === "cafe" && currentQ && (
        <div className="sq-cafe-game-viewport">
          {/* Top Cafe Utility Bar */}
          <div className="sq-cafe-subnav">
            <div className="sq-cafe-stats-left">
              <span className="sq-cafe-pill till-pill">💰 Till: ${cashEarned}</span>
              <span className="sq-cafe-pill stars-pill">⭐ Stars: {starsEarned}</span>
              <span className="sq-cafe-pill rent-pill">Rent: ${cashEarned}/$120</span>
            </div>

            <div className="sq-cafe-controls-right">
              <button
                type="button"
                className="sq-cafe-sound-toggle"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? "🔊" : "🔇"}
              </button>
              <button
                type="button"
                className="sq-cafe-exit-btn"
                onClick={() => setPhase("intro")}
              >
                ← Back
              </button>
            </div>
          </div>

          <div className="sq-cafe-stage-grid">
            {/* LEFT SIDE: Coffee Shop Scene */}
            <div className="sq-cafe-scene-panel">
              {/* Hanging Shelf with Plant & Coffee Jars */}
              <div className="sq-cafe-shelf">
                <div className="sq-shelf-plank" />
                <div className="sq-shelf-jars">
                  <div className="sq-jar jar-a"><span>A</span></div>
                  <div className="sq-jar jar-b"><span>B</span></div>
                  <div className="sq-jar jar-c"><span>C</span></div>
                </div>
                <div className="sq-shelf-plant">🌿</div>
                <div className="sq-cafe-lamp">
                  <div className="sq-lamp-cord" />
                  <div className="sq-lamp-shade" />
                  <div className="sq-lamp-glow" />
                </div>
              </div>

              {/* Wooden Arched Cafe Window */}
              <div className="sq-cafe-window">
                <div className="sq-window-pane" />
              </div>

              {/* Hanging Chalkboard with Tips */}
              <div className="sq-cafe-chalkboard">
                <div className="sq-chalk-text">{chalkboardTip}</div>
              </div>

              {/* Speech Bubble Order from Customer */}
              <div className={`sq-cafe-speech-bubble ${isAnswerRevealed ? (selectedAnswer === currentQ.correctIndex ? "happy" : "wrong") : ""}`}>
                <div className="sq-order-prompt-label">ORDER:</div>
                <p className="sq-order-question">{currentQ.question}</p>
                {isAnswerRevealed && (
                  <div className="sq-order-feedback">
                    {selectedAnswer === currentQ.correctIndex ? (
                      <span className="sq-praise-text">"{currentCustomer.praise}"</span>
                    ) : (
                      <span className="sq-remedy-text">"Ah, not quite! I ordered {currentQ.options[currentQ.correctIndex]}."</span>
                    )}
                  </div>
                )}
              </div>

              {/* Regular Customer standing at counter */}
              <div className="sq-cafe-customer-slot">
                <div className="sq-customer-art">
                  {/* Turtle Customer */}
                  {currentCustomer.avatarType === "turtle" && (
                    <svg viewBox="0 0 160 160" width="130" height="130">
                      <ellipse cx="80" cy="95" rx="54" ry="46" fill="#3B7A57" stroke="#1E3A2B" strokeWidth="4" />
                      <circle cx="80" cy="54" r="26" fill="#6B9080" />
                      {/* Archivist Hat */}
                      <path d="M54 44H106L98 28H62Z" fill="#8C5C38" />
                      <ellipse cx="80" cy="44" rx="30" ry="6" fill="#6B4423" />
                      {/* Glasses & face */}
                      <circle cx="72" cy="54" r="7" fill="none" stroke="#2B180A" strokeWidth="2.5" />
                      <circle cx="88" cy="54" r="7" fill="none" stroke="#2B180A" strokeWidth="2.5" />
                      <line x1="79" y1="54" x2="81" y2="54" stroke="#2B180A" strokeWidth="2.5" />
                      {/* Newspaper */}
                      <rect x="36" y="112" width="46" height="34" rx="3" fill="#E8E8E8" stroke="#333" strokeWidth="2" />
                    </svg>
                  )}

                  {/* Owl Customer */}
                  {currentCustomer.avatarType === "owl" && (
                    <svg viewBox="0 0 160 160" width="130" height="130">
                      <ellipse cx="80" cy="92" rx="46" ry="44" fill="#C2844E" />
                      {/* Big round eyes */}
                      <circle cx="64" cy="62" r="18" fill="#FFF" stroke="#2A1600" strokeWidth="3" />
                      <circle cx="96" cy="62" r="18" fill="#FFF" stroke="#2A1600" strokeWidth="3" />
                      <circle cx="64" cy="62" r="8" fill="#2A1600" />
                      <circle cx="96" cy="62" r="8" fill="#2A1600" />
                      <polygon points="80,72 73,84 87,84" fill="#FFA826" />
                      {/* Pilot Scarf */}
                      <rect x="52" y="104" width="56" height="16" rx="8" fill="#DC2626" />
                    </svg>
                  )}

                  {/* Rabbit Customer */}
                  {currentCustomer.avatarType === "rabbit" && (
                    <svg viewBox="0 0 160 160" width="130" height="130">
                      {/* Long Ears */}
                      <ellipse cx="64" cy="36" rx="9" ry="28" fill="#F8FAFC" stroke="#334155" strokeWidth="3" />
                      <ellipse cx="64" cy="36" rx="5" ry="20" fill="#F472B6" />
                      <ellipse cx="96" cy="36" rx="9" ry="28" fill="#F8FAFC" stroke="#334155" strokeWidth="3" />
                      <ellipse cx="96" cy="36" rx="5" ry="20" fill="#F472B6" />
                      {/* Head */}
                      <circle cx="80" cy="74" r="28" fill="#F8FAFC" stroke="#334155" strokeWidth="3" />
                      <circle cx="70" cy="72" r="3.5" fill="#334155" />
                      <circle cx="90" cy="72" r="3.5" fill="#334155" />
                      <polygon points="80,78 77,82 83,82" fill="#F472B6" />
                      {/* Headband & Headphones */}
                      <rect x="52" y="60" width="56" height="8" rx="4" fill="#EF4444" />
                      <circle cx="50" cy="72" r="9" fill="#1E293B" />
                      <circle cx="110" cy="72" r="9" fill="#1E293B" />
                    </svg>
                  )}

                  {/* Cat Customer */}
                  {currentCustomer.avatarType === "cat" && (
                    <svg viewBox="0 0 160 160" width="130" height="130">
                      <polygon points="56,36 46,62 70,58" fill="#E2E8F0" stroke="#334155" strokeWidth="3" />
                      <polygon points="104,36 90,58 114,62" fill="#E2E8F0" stroke="#334155" strokeWidth="3" />
                      <circle cx="80" cy="76" r="30" fill="#E2E8F0" stroke="#334155" strokeWidth="3" />
                      <circle cx="70" cy="74" r="3.5" fill="#0284C7" />
                      <circle cx="90" cy="74" r="3.5" fill="#0284C7" />
                      {/* Nurse scrubs */}
                      <path d="M50 110L110 110L104 150L56 150Z" fill="#38BDF8" />
                      <rect x="76" y="118" width="8" height="2" fill="#FFF" />
                    </svg>
                  )}

                  {/* Fox Customer */}
                  {currentCustomer.avatarType === "fox" && (
                    <svg viewBox="0 0 160 160" width="130" height="130">
                      <polygon points="54,34 46,64 74,58" fill="#EA580C" stroke="#2B1600" strokeWidth="3" />
                      <polygon points="106,34 86,58 114,64" fill="#EA580C" stroke="#2B1600" strokeWidth="3" />
                      <circle cx="80" cy="76" r="28" fill="#EA580C" />
                      <path d="M52 76Q80 98 108 76" fill="#FFF" />
                      <circle cx="70" cy="72" r="3.5" fill="#2B1600" />
                      <circle cx="90" cy="72" r="3.5" fill="#2B1600" />
                      <circle cx="80" cy="80" r="4" fill="#2B1600" />
                    </svg>
                  )}
                </div>

                <div className="sq-customer-nametag">
                  <strong>{currentCustomer.name}</strong>
                  <small>{currentCustomer.title}</small>
                </div>
              </div>

              {/* Wooden Coffee Counter */}
              <div className="sq-cafe-counter">
                {/* Barista behind the counter */}
                <div className={`sq-cafe-barista ${servingAnim ? "serving" : ""}`}>
                  <svg viewBox="0 0 120 120" width="86" height="86">
                    <circle cx="36" cy="38" r="9" fill="#8C5C38" />
                    <circle cx="84" cy="38" r="9" fill="#8C5C38" />
                    <ellipse cx="60" cy="58" rx="32" ry="28" fill="#B27A4E" />
                    <circle cx="50" cy="54" r="8" fill="none" stroke="#2B180A" strokeWidth="2.5" />
                    <circle cx="70" cy="54" r="8" fill="none" stroke="#2B180A" strokeWidth="2.5" />
                    <line x1="58" y1="54" x2="62" y2="54" stroke="#2B180A" strokeWidth="2.5" />
                    {/* Apron */}
                    <path d="M38 86L82 86L78 120L42 120Z" fill="#F4EBD9" stroke="#3D2111" strokeWidth="2" />
                    <rect x="52" y="94" width="16" height="16" rx="3" fill="#E26D5C" />
                  </svg>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: "TODAY'S MENU" Options Board */}
            <div className="sq-cafe-menu-panel">
              <div className="sq-menu-header">
                <h3>{deck.title.slice(0, 18)} Café</h3>
                <span className="sq-menu-subtitle">TODAY'S MENU</span>
              </div>

              <div className="sq-menu-items-grid">
                {currentQ.options.map((option, i) => {
                  const isCorrect = i === currentQ.correctIndex;
                  const isSelected = selectedAnswer === i;
                  let cardClass = "sq-menu-card";
                  if (isAnswerRevealed) {
                    if (isCorrect) cardClass += " is-correct";
                    else if (isSelected) cardClass += " is-wrong";
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      className={cardClass}
                      onClick={() => handleSelectMenuItem(i)}
                      disabled={isAnswerRevealed}
                    >
                      {/* Drink Illustration */}
                      <div className="sq-drink-illustration-wrap">
                        {/* 0: Layered Iced Macchiato */}
                        {i % 4 === 0 && (
                          <svg viewBox="0 0 60 70" width="46" height="54">
                            <rect x="18" y="14" width="24" height="48" rx="4" fill="#FFF" stroke="#64748B" strokeWidth="2.5" opacity="0.6" />
                            <rect x="20" y="38" width="20" height="22" fill="#5A3E26" rx="2" />
                            <rect x="20" y="24" width="20" height="14" fill="#EAD5BC" />
                            <rect x="20" y="16" width="20" height="8" fill="#FFF" />
                          </svg>
                        )}
                        {/* 1: Hot Mug */}
                        {i % 4 === 1 && (
                          <svg viewBox="0 0 60 70" width="46" height="54">
                            <rect x="16" y="24" width="28" height="34" rx="5" fill="#FFF" stroke="#475569" strokeWidth="2.5" />
                            <path d="M44 32C49 32 50 42 44 46" stroke="#475569" strokeWidth="3" fill="none" />
                            <ellipse cx="30" cy="24" rx="14" ry="4" fill="#3E2723" />
                          </svg>
                        )}
                        {/* 2: Saucer Cup */}
                        {i % 4 === 2 && (
                          <svg viewBox="0 0 60 70" width="46" height="54">
                            <ellipse cx="30" cy="56" rx="24" ry="6" fill="#E2E8F0" stroke="#475569" strokeWidth="2" />
                            <path d="M18 36L42 36L38 52L22 52Z" fill="#FFF" stroke="#475569" strokeWidth="2.5" />
                            <ellipse cx="30" cy="36" rx="12" ry="4" fill="#4E342E" />
                          </svg>
                        )}
                        {/* 3: Iced Matcha with Straw */}
                        {i % 4 === 3 && (
                          <svg viewBox="0 0 60 70" width="46" height="54">
                            <line x1="32" y1="6" x2="26" y2="28" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" />
                            <path d="M18 20L42 20L38 62L22 62Z" fill="#84CC16" opacity="0.85" stroke="#475569" strokeWidth="2" />
                            <ellipse cx="30" cy="20" rx="12" ry="3" fill="#A3E635" />
                          </svg>
                        )}
                      </div>

                      <div className="sq-menu-card-title">{option}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SHIFT SUMMARY ---------------- */}
      {phase === "summary" && (
        <div className="sq-cafe-summary-wrap">
          <div className="sq-cafe-summary-card">
            <h2>☕ Shift Complete!</h2>
            <p>You paid the café rent and served your regulars with pride!</p>

            <div className="sq-summary-stats-grid">
              <div className="sq-stat-box">
                <span className="val">${cashEarned}</span>
                <span className="lbl">Till Revenue</span>
              </div>
              <div className="sq-stat-box">
                <span className="val">⭐ {starsEarned}</span>
                <span className="lbl">Stars Awarded</span>
              </div>
              <div className="sq-stat-box">
                <span className="val">{customersServed}</span>
                <span className="lbl">Customers Served</span>
              </div>
            </div>

            <div className="sq-summary-buttons">
              <button
                type="button"
                className="sq-btn-primary"
                onClick={() => handleStartGame(false)}
              >
                🔄 Next Shift
              </button>
              <a href="/dashboard" className="sq-btn-ghost">
                📝 Change Notes
              </a>
              <a href="/games" className="sq-btn-ghost">
                🎮 Back to Games
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
