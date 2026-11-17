import { useState, useEffect, useRef } from "react";
import TopNav from "./TopNav";
import { getActiveDeck, updatePlayerStats, recordActivityToday, type DeckInfo } from "./studyStore";
import { type Question } from "./quizData";
import "./studyCafe.css";

interface CafeCustomer {
  id: string;
  name: string;
  title: string;
  imageSrc: string;
  greeting: string;
  praise: string;
  remedy: string;
}

// 1. Integrated Provided Customers from C:\Users\aball\Downloads\assets\customers
const CAFE_CUSTOMERS: CafeCustomer[] = [
  {
    id: "zoro",
    name: "Roronoa Zoro",
    title: "SWORDSMAN",
    imageSrc: "/games/study-cafe/customer_zoro.png",
    greeting: "Huh?! Lost my way to this café. My order is a question from your notes...",
    praise: "Not bad! My memory is as sharp as my three blades. Delicious brew!",
    remedy: "Oi! That wasn't what I asked for! Try to remember the right answer."
  },
  {
    id: "shanks",
    name: "Red-Haired Shanks",
    title: "YONKO CAPTAIN",
    imageSrc: "/games/study-cafe/customer_shanks.png",
    greeting: "Ah, what a cozy café! Let's see how well you know your study notes...",
    praise: "Dahahaha! Outstanding brew! You've mastered this subject completely!",
    remedy: "No worries! Even the best pirates make mistakes. Learn from it and push forward!"
  },
  {
    id: "gyro",
    name: "Gyro Zeppeli",
    title: "STEEL BALL RUNNER",
    imageSrc: "/games/study-cafe/customer_gyro.png",
    greeting: "Nyo-ho! Spin me a fine beverage. Answer my order with precision!",
    praise: "Nyo-ho-ho! Golden Rotation! That answer was completely on target!",
    remedy: "Lesson 1! You miscalculated the spin. Remember the true answer next time!"
  },
  {
    id: "luffy",
    name: "Straw Hat Luffy",
    title: "PIRATE CAPTAIN",
    imageSrc: "/games/study-cafe/customer_luffy.png",
    greeting: "WOAAAH! What's on the menu today?! Make me something delicious from your notes!",
    praise: "SUGEEEE!! That's the best drink on the entire ocean! Full energy!",
    remedy: "EHHHH?! That's not what I ordered! My stomach is rumbling!"
  }
];

// Provided Bartender and Background assets
const BARTENDER_IMG = "/games/study-cafe/bartender.png";
const CAFE_BG_IMG = "/games/study-cafe/bg.jpg";

export default function StudyCafeGame() {
  const [deck, setDeck] = useState<DeckInfo>(getActiveDeck());
  const [questions, setQuestions] = useState<Question[]>(deck.questions);
  const [phase, setPhase] = useState<"intro" | "opening" | "cafe" | "summary">("intro");

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [customerIndex, setCustomerIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // Loading Screen progress
  const [loadingProgress, setLoadingProgress] = useState(0);

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

  const currentCustomer = CAFE_CUSTOMERS[customerIndex % CAFE_CUSTOMERS.length];
  const currentQ = questions[currentQIndex % questions.length];

  // Refresh deck if updated
  useEffect(() => {
    const d = getActiveDeck();
    setDeck(d);
    setQuestions(d.questions);
  }, []);

  // Loading animation controller
  useEffect(() => {
    let timer: any = null;
    if (phase === "opening") {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 90);

      timer = setTimeout(() => {
        setPhase("cafe");
        setCurrentQIndex(0);
        setCustomerIndex(0);
        setCashEarned(0);
        setStarsEarned(0);
        setCustomersServed(0);
        setStreak(0);
        setChalkboardTip("Here comes our first regular. Their order is a question from your notes.");
      }, 2000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [phase]);

  const handleStartGame = (useSample = false) => {
    if (useSample) {
      const sample = getActiveDeck();
      setQuestions(sample.questions);
    }
    setPhase("opening");
  };

  const playChime = (success: boolean) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      if (success) {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.24); // G5
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.7);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.7);
      } else {
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        osc.frequency.setValueAtTime(240, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {}
  };

  const handleSelectMenuItem = (optionIdx: number) => {
    if (isAnswerRevealed || !currentQ) return;

    setSelectedAnswer(optionIdx);
    setIsAnswerRevealed(true);
    const isCorrect = optionIdx === currentQ.correctIndex;

    playChime(isCorrect);

    if (isCorrect) {
      setServingAnim(true);
      const earned = 15;
      setCashEarned((c) => c + earned);
      setStarsEarned((s) => s + 1);
      setCustomersServed((n) => n + 1);
      setStreak((st) => st + 1);
      updatePlayerStats({ coins: earned, stars: 1 });
      recordActivityToday("Study Café Order Served", 15);
      setChalkboardTip("Order up! Perfect memory earns stars and till revenue!");

      setTimeout(() => {
        setServingAnim(false);
        setIsAnswerRevealed(false);
        setSelectedAnswer(null);

        if (currentQIndex + 1 >= Math.min(questions.length, 12)) {
          setPhase("summary");
        } else {
          setCurrentQIndex((i) => i + 1);
          setCustomerIndex((c) => c + 1);
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
          setCurrentQIndex((i) => i + 1);
          setCustomerIndex((c) => c + 1);
        }
      }, 2000);
    }
  };

  return (
    <div className="sq-cafe-app">
      <TopNav activeTab="games" />

      {/* ---------------- 1. INTRO / KEY ART SCREEN ---------------- */}
      {phase === "intro" && (
        <main className="sq-cafe-intro-wrap">
          <div className="sq-cafe-crumbs">
            <a href="/">Home</a> <span>›</span> <a href="/games">Games</a> <span>›</span>{" "}
            <strong>Study Café</strong>
          </div>

          <div className="sq-cafe-hero-grid">
            <div className="sq-cafe-copy">
              <h1>Study Café: A Cozy Coffee Shop Built From Your Notes</h1>
              <p className="sq-cafe-lede">
                Run a café where each customer's order is a question from your study notes. Serve
                the matching menu item to earn stars and money, pay the rent, and upgrade the
                café!
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
                <span>
                  Active deck: <strong>{deck.title}</strong> ({deck.questions.length} questions)
                </span>
                <a href="/dashboard">Change notes</a>
              </div>
            </div>

            {/* Cozy preview art card */}
            <div className="sq-cafe-preview-card">
              <div className="sq-cafe-card-inner">
                <img
                  src={CAFE_BG_IMG}
                  alt="Study Cafe Key Art"
                  className="sq-cafe-art-img"
                />
                <div className="sq-cafe-preview-bartender-overlay">
                  <img src={BARTENDER_IMG} alt="Bartender Luffy" />
                </div>
                <button
                  type="button"
                  className="sq-cafe-float-play-btn"
                  onClick={() => handleStartGame(false)}
                >
                  ▶ Play Study Café
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ---------------- 2. REDESIGNED LOADING SCREEN (First Reference Image) ---------------- */}
      {phase === "opening" && (
        <div className="sq-cafe-opening-screen">
          <div className="sq-barista-opening-card">
            {/* Centered Bartender Character from provided asset */}
            <div className="sq-opening-bartender-wrap">
              <img
                src={BARTENDER_IMG}
                alt="Café Bartender"
                className="sq-opening-bartender-img"
              />
            </div>

            {/* Elegant Serif Italic Title based on reference screenshot */}
            <h2 className="sq-opening-serif-title">Opening the café...</h2>

            {/* Warm loading progress bar */}
            <div className="sq-opening-progress-track">
              <div
                className="sq-opening-progress-fill"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>

            <p className="sq-opening-subtitle">
              Brewing fresh coffee and writing out today's question menu...
            </p>
          </div>
        </div>
      )}

      {/* ---------------- 3. REDESIGNED GAMEPLAY & CHOICE SCREEN (Second Reference Image) ---------------- */}
      {phase === "cafe" && currentQ && (
        <div className="sq-cafe-game-viewport">
          {/* Top Cafe Utility & Stats Bar */}
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
                title={soundEnabled ? "Mute audio" : "Unmute audio"}
              >
                {soundEnabled ? "🔊" : "🔇"}
              </button>
              <button
                type="button"
                className="sq-cafe-exit-btn"
                onClick={() => setPhase("intro")}
              >
                ← Exit
              </button>
            </div>
          </div>

          <div className="sq-cafe-stage-grid">
            {/* LEFT SIDE: Coffee Shop Scene with Real Background & Provided Characters */}
            <div
              className="sq-cafe-scene-panel"
              style={{ backgroundImage: `url(${CAFE_BG_IMG})` }}
            >
              {/* Cozy ambient gradient overlay for contrast */}
              <div className="sq-cafe-scene-vignette" />

              {/* Hanging Chalkboard with Tips */}
              <div className="sq-cafe-chalkboard">
                <div className="sq-chalk-text">{chalkboardTip}</div>
              </div>

              {/* Speech Bubble Order from Customer */}
              <div
                className={`sq-cafe-speech-bubble ${
                  isAnswerRevealed
                    ? selectedAnswer === currentQ.correctIndex
                      ? "happy"
                      : "wrong"
                    : ""
                }`}
              >
                <div className="sq-order-prompt-label">ORDER:</div>
                <p className="sq-order-question">{currentQ.question}</p>
                {isAnswerRevealed && (
                  <div className="sq-order-feedback">
                    {selectedAnswer === currentQ.correctIndex ? (
                      <span className="sq-praise-text">"{currentCustomer.praise}"</span>
                    ) : (
                      <span className="sq-remedy-text">"{currentCustomer.remedy}"</span>
                    )}
                  </div>
                )}
                {/* Speech tail pointing to customer */}
                <div className="sq-bubble-tail" />
              </div>

              {/* Floating Star Animation when correct */}
              {isAnswerRevealed && selectedAnswer === currentQ.correctIndex && (
                <div className="sq-floating-star-badge">⭐ +1 star</div>
              )}

              {/* Floating Cash Pill when correct */}
              {isAnswerRevealed && selectedAnswer === currentQ.correctIndex && (
                <div className="sq-floating-cash-badge">+$15</div>
              )}

              {/* Customer Standing at Counter (from provided assets) */}
              <div className="sq-cafe-customer-slot">
                <div className="sq-customer-art-box">
                  <img
                    src={currentCustomer.imageSrc}
                    alt={currentCustomer.name}
                    className="sq-customer-portrait-img"
                  />
                </div>

                <div className="sq-customer-nametag">
                  <strong>{currentCustomer.name}</strong>
                  <small>{currentCustomer.title}</small>
                </div>
              </div>

              {/* Wooden Coffee Counter */}
              <div className="sq-cafe-counter">
                {/* Steaming Coffee Cup on Counter when served */}
                {servingAnim && (
                  <div className="sq-served-coffee-cup" title="Freshly brewed coffee served!">
                    <svg viewBox="0 0 60 50" width="48" height="40">
                      {/* Steam */}
                      <path
                        d="M20 10 Q24 4 20 -2 M28 10 Q32 4 28 -2"
                        stroke="#FFF"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        fill="none"
                        className="sq-coffee-steam-line"
                      />
                      {/* Cup */}
                      <path d="M12 16L40 16L36 40L16 40Z" fill="#FFF8EE" stroke="#3D2111" strokeWidth="2.5" />
                      <path d="M40 22C46 22 47 32 40 34" stroke="#3D2111" strokeWidth="3" fill="none" />
                      <ellipse cx="26" cy="16" rx="14" ry="4" fill="#5A3E26" />
                      {/* Saucer */}
                      <ellipse cx="26" cy="42" rx="22" ry="5" fill="#E8D8C8" stroke="#3D2111" strokeWidth="2" />
                    </svg>
                  </div>
                )}

                {/* Bartender Behind Counter (from provided assets) */}
                <div className={`sq-cafe-barista ${servingAnim ? "serving" : ""}`}>
                  <img
                    src={BARTENDER_IMG}
                    alt="Luffy Bartender"
                    className="sq-barista-char-img"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: "TODAY'S MENU" Choice Screen (Redesigned per Reference Image) */}
            <div className="sq-cafe-menu-panel">
              <div className="sq-menu-header">
                <h3>{deck.title.slice(0, 18)} Café</h3>
                <span className="sq-menu-subtitle">TODAY'S MENU</span>
              </div>

              {/* 2x2 Choice Cards Grid */}
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
                      {/* Drink Illustration inside Circular Badge */}
                      <div className="sq-drink-illustration-wrap">
                        {/* 0: Layered Iced Macchiato */}
                        {i % 4 === 0 && (
                          <svg viewBox="0 0 60 70" width="46" height="54" aria-hidden="true">
                            <rect
                              x="18"
                              y="14"
                              width="24"
                              height="48"
                              rx="4"
                              fill="#FFF"
                              stroke="#64748B"
                              strokeWidth="2.5"
                              opacity="0.6"
                            />
                            <rect x="20" y="38" width="20" height="22" fill="#5A3E26" rx="2" />
                            <rect x="20" y="24" width="20" height="14" fill="#EAD5BC" />
                            <rect x="20" y="16" width="20" height="8" fill="#FFF" />
                          </svg>
                        )}
                        {/* 1: Hot Mug */}
                        {i % 4 === 1 && (
                          <svg viewBox="0 0 60 70" width="46" height="54" aria-hidden="true">
                            <rect
                              x="16"
                              y="24"
                              width="28"
                              height="34"
                              rx="5"
                              fill="#FFF"
                              stroke="#475569"
                              strokeWidth="2.5"
                            />
                            <path
                              d="M44 32C49 32 50 42 44 46"
                              stroke="#475569"
                              strokeWidth="3"
                              fill="none"
                            />
                            <ellipse cx="30" cy="24" rx="14" ry="4" fill="#3E2723" />
                          </svg>
                        )}
                        {/* 2: Saucer Cup */}
                        {i % 4 === 2 && (
                          <svg viewBox="0 0 60 70" width="46" height="54" aria-hidden="true">
                            <ellipse
                              cx="30"
                              cy="56"
                              rx="24"
                              ry="6"
                              fill="#E2E8F0"
                              stroke="#475569"
                              strokeWidth="2"
                            />
                            <path
                              d="M18 36L42 36L38 52L22 52Z"
                              fill="#FFF"
                              stroke="#475569"
                              strokeWidth="2.5"
                            />
                            <ellipse cx="30" cy="36" rx="12" ry="4" fill="#4E342E" />
                          </svg>
                        )}
                        {/* 3: Iced Matcha with Straw */}
                        {i % 4 === 3 && (
                          <svg viewBox="0 0 60 70" width="46" height="54" aria-hidden="true">
                            <line
                              x1="32"
                              y1="6"
                              x2="26"
                              y2="28"
                              stroke="#10B981"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />
                            <path
                              d="M18 20L42 20L38 62L22 62Z"
                              fill="#84CC16"
                              opacity="0.85"
                              stroke="#475569"
                              strokeWidth="2"
                            />
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

      {/* ---------------- 4. SHIFT SUMMARY SCREEN ---------------- */}
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
