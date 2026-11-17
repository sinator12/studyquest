import { useState, useEffect, useCallback, useRef } from "react";
import { GAMES, CATEGORIES } from "./gamesData";
import { getQuestions, shuffle, type Question } from "./quizData";
import { getActiveDeck } from "./studyStore";
import TopNav from "./TopNav";
import "./gamePlay.css";

/* ------------------------------------------------------------------ */
/*  Game mode mapping                                                  */
/* ------------------------------------------------------------------ */

type GameMode = "classic" | "speed" | "truefalse" | "memory" | "survival";

const MODE_LABELS: Record<GameMode, string> = {
  classic: "Classic Quiz",
  speed: "Speed Round",
  truefalse: "True or False",
  memory: "Memory Match",
  survival: "Survival",
};

const SPEED_SLUGS = new Set(["quiz-rocket","neon-rush","meteor-storm","phantom-flash","pizza-rush","study-bird","subway-surfers","mountain-climb","snake","quiz-ninja","mole-mash","quiz-wings","pocket-bounce","glow-up","deep-dive","stack"]);
const TF_SLUGS = new Set(["flashcards","flash","hangman","study-style","tinder"]);
const MEMORY_SLUGS = new Set(["memory-match","gem-recall","brain-breaker","crossword","bubble-shooter","block-blast"]);
const SURVIVAL_SLUGS = new Set(["boss-battle","boss-raid","dungeon-depths","vault-heist","spooky-manor","study-sweep","lanternfall","mind-vault","buddy-battles","shadow-maze","angry-nerds","glitch-hunter","super-pip"]);

function getGameMode(slug: string): GameMode {
  if (SPEED_SLUGS.has(slug)) return "speed";
  if (TF_SLUGS.has(slug)) return "truefalse";
  if (MEMORY_SLUGS.has(slug)) return "memory";
  if (SURVIVAL_SLUGS.has(slug)) return "survival";
  return "classic";
}

/* ------------------------------------------------------------------ */
/*  Memory card type                                                   */
/* ------------------------------------------------------------------ */

interface MemCard {
  id: number;
  pairId: number;
  content: string;
  type: "question" | "answer";
}

/* ------------------------------------------------------------------ */
/*  Confetti helper                                                    */
/* ------------------------------------------------------------------ */

function Confetti() {
  const colors = ["#FFA826","#34D399","#818CF8","#F87171","#FBBF24","#A78BFA","#38BDF8"];
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.2,
    color: colors[i % colors.length],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));
  return (
    <div className="gp-confetti">
      {pieces.map(p => (
        <div
          key={p.id}
          className="gp-confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Main component                                                     */
/* ================================================================== */

export default function GamePlayPage() {
  const slug = window.location.pathname.replace(/^\/games\//, "").replace(/\/$/, "");
  const game = GAMES.find(g => g.slug === slug);
  const category = game ? CATEGORIES.find(c => c.slug === game.category) : undefined;
  const mode = getGameMode(slug);

  /* ---- state ---- */
  const [phase, setPhase] = useState<"intro" | "playing" | "result">("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lives, setLives] = useState(3);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // TF state
  const [tfIsTrue, setTfIsTrue] = useState(true);
  const [tfAnswer, setTfAnswer] = useState<boolean | null>(null);

  // Memory state
  const [memCards, setMemCards] = useState<MemCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [memMoves, setMemMoves] = useState(0);

  const timerRef = useRef(0);
  const elapsedRef = useRef(0);
  const startTimeRef = useRef(0);

  /* ---- game not found ---- */
  if (!game) {
    return (
      <div className="gp">
        <div className="gp-not-found">
          <h1>404</h1>
          <p>Game not found</p>
          <a href="/games" className="gp-btn gp-btn-primary">← Back to Games</a>
        </div>
      </div>
    );
  }

  /* ---- Start game ---- */
  const startGame = () => {
    const count = mode === "memory" ? 6 : mode === "speed" ? 20 : 10;
    const activeDeck = getActiveDeck();
    let qs: Question[] = [];
    if (activeDeck && activeDeck.questions.length > 0) {
      qs = shuffle([...activeDeck.questions]);
      while (qs.length < count) {
        qs.push(...shuffle([...activeDeck.questions]));
      }
      qs = qs.slice(0, count);
    } else {
      qs = getQuestions(count);
    }
    setQuestions(qs);
    setIdx(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrect(0);
    setSelected(null);
    setFeedback(false);
    setTotalAnswered(0);
    setLives(3);
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    if (mode === "speed") setTimeLeft(60);
    else if (mode === "survival") setTimeLeft(15);
    else if (mode === "classic") setTimeLeft(30);
    else setTimeLeft(0);

    // TF setup
    if (mode === "truefalse" && qs.length > 0) {
      const isTrue = Math.random() > 0.5;
      setTfIsTrue(isTrue);
      setTfAnswer(null);
    }

    // Memory setup
    if (mode === "memory") {
      const pairs: MemCard[] = qs.slice(0, 6).flatMap((q, i) => [
        { id: i * 2, pairId: i, content: q.question, type: "question" as const },
        { id: i * 2 + 1, pairId: i, content: q.options[q.correctIndex], type: "answer" as const },
      ]);
      setMemCards(shuffle(pairs));
      setFlipped([]);
      setMatched([]);
      setMemMoves(0);
    }

    setPhase("playing");
  };

  /* ---- Timer effect ---- */
  useEffect(() => {
    if (phase !== "playing") return;
    if (mode === "truefalse" || mode === "memory") return;
    if (timeLeft <= 0) return;

    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (mode === "speed") {
            setElapsedTime(60);
            setPhase("result");
            return 0;
          }
          if (mode === "survival") {
            setLives(l => {
              const next = l - 1;
              if (next <= 0) { setPhase("result"); return 0; }
              return next;
            });
            setIdx(i => {
              const nextI = i + 1;
              if (nextI >= questions.length) { setPhase("result"); return i; }
              setSelected(null);
              setFeedback(false);
              return nextI;
            });
            return 15;
          }
          // classic: skip
          setIdx(i => {
            const nextI = i + 1;
            if (nextI >= questions.length) {
              setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
              setPhase("result");
              return i;
            }
            setSelected(null);
            setFeedback(false);
            return nextI;
          });
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase, timeLeft, mode, questions.length]);

  /* ---- Elapsed timer for non-timed modes ---- */
  useEffect(() => {
    if (phase !== "playing") return;
    if (mode !== "truefalse" && mode !== "memory") return;

    elapsedRef.current = window.setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(elapsedRef.current);
  }, [phase, mode]);

  /* ---- Answer handler (classic / speed / survival) ---- */
  const handleAnswer = useCallback((ansIdx: number) => {
    if (feedback && mode !== "speed") return;
    const q = questions[idx];
    if (!q) return;

    const isCorrect = ansIdx === q.correctIndex;
    setSelected(ansIdx);
    setTotalAnswered(t => t + 1);

    if (isCorrect) {
      const pts = mode === "speed" ? 10 : mode === "survival" ? 15 : 10;
      setScore(s => s + pts);
      setCorrect(c => c + 1);
      setStreak(s => {
        const next = s + 1;
        setBestStreak(b => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
      if (mode === "survival") {
        setLives(l => {
          if (l <= 1) {
            setTimeout(() => setPhase("result"), 800);
            return 0;
          }
          return l - 1;
        });
      }
      if (mode === "speed") {
        setScore(s => Math.max(0, s - 5));
      }
    }

    if (mode === "speed") {
      // Immediate next question
      setSelected(null);
      setIdx(i => {
        const nextI = i + 1;
        if (nextI >= questions.length) {
          // Generate more questions for speed mode
          const moreQs = getQuestions(20);
          setQuestions(prev => [...prev, ...moreQs]);
        }
        return nextI;
      });
      return;
    }

    setFeedback(true);
    clearInterval(timerRef.current);

    setTimeout(() => {
      setFeedback(false);
      setSelected(null);
      setIdx(i => {
        const nextI = i + 1;
        if (nextI >= questions.length) {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
          setPhase("result");
          return i;
        }
        if (mode === "classic") setTimeLeft(30);
        if (mode === "survival") setTimeLeft(15);
        return nextI;
      });
    }, 1500);
  }, [feedback, mode, questions, idx]);

  /* ---- TF handler ---- */
  const handleTF = useCallback((answer: boolean) => {
    if (tfAnswer !== null) return;
    const q = questions[idx];
    if (!q) return;

    const isCorrect = answer === tfIsTrue;
    setTfAnswer(answer);
    setTotalAnswered(t => t + 1);

    if (isCorrect) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      setStreak(s => { const next = s + 1; setBestStreak(b => Math.max(b, next)); return next; });
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      setIdx(i => {
        const nextI = i + 1;
        if (nextI >= questions.length) {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
          setPhase("result");
          return i;
        }
        // Setup next TF
        const nextIsTrue = Math.random() > 0.5;
        setTfIsTrue(nextIsTrue);
        setTfAnswer(null);
        return nextI;
      });
    }, 1200);
  }, [tfAnswer, tfIsTrue, questions, idx]);

  /* ---- Memory handler ---- */
  const handleMemoryClick = useCallback((cardId: number) => {
    if (flipped.length >= 2) return;
    if (matched.includes(cardId)) return;
    if (flipped.includes(cardId)) return;

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMemMoves(m => m + 1);
      const [a, b] = newFlipped;
      const cardA = memCards.find(c => c.id === a);
      const cardB = memCards.find(c => c.id === b);

      if (cardA && cardB && cardA.pairId === cardB.pairId && cardA.type !== cardB.type) {
        // Match!
        setTimeout(() => {
          setMatched(prev => {
            const next = [...prev, a, b];
            setScore(s => s + 20);
            setCorrect(c => c + 1);
            if (next.length === memCards.length) {
              setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
              setPhase("result");
            }
            return next;
          });
          setFlipped([]);
        }, 600);
      } else {
        // No match
        setTimeout(() => setFlipped([]), 900);
      }
    }
  }, [flipped, matched, memCards]);

  /* ---- Helpers ---- */
  const q = questions[idx];
  const progress = questions.length > 0 ? ((idx) / questions.length) * 100 : 0;
  const totalQ = mode === "memory" ? 6 : questions.length;
  const accuracyPct = totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0;
  const stars = accuracyPct >= 90 ? 3 : accuracyPct >= 60 ? 2 : accuracyPct >= 30 ? 1 : 0;

  /* ---- TF statement ---- */
  const getTFStatement = (): string => {
    if (!q) return "";
    if (tfIsTrue) {
      return `${q.question} → ${q.options[q.correctIndex]}`;
    }
    // Pick a wrong answer
    const wrongOptions = q.options.filter((_, i) => i !== q.correctIndex);
    const wrongAnswer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    return `${q.question} → ${wrongAnswer}`;
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="gp" style={{ "--gp-accent": category?.color || "#FFA826" } as React.CSSProperties}>

      {/* ---- INTRO ---- */}
      {phase === "intro" && (
        <div className="gp-intro">
          <a href="/games" className="gp-back">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Games
          </a>
          <div className="gp-intro-hero">
            <img src={game.image} alt={game.name} />
          </div>
          <h1>{game.name}</h1>
          {game.description && <p className="gp-intro-desc">{game.description}</p>}
          <div className="gp-intro-meta">
            {category && (
              <span className="gp-badge" style={{ borderColor: category.color, color: category.color }}>
                {category.label}
              </span>
            )}
            <span className="gp-badge gp-badge-accent">
              {MODE_LABELS[mode]}
            </span>
            <span className="gp-badge">
              {mode === "memory" ? "6 pairs" : mode === "speed" ? "60 seconds" : `10 questions`}
            </span>
            {game.multiplayer && (
              <span className="gp-badge" style={{ borderColor: "#3B82F6", color: "#3B82F6" }}>
                Multiplayer
              </span>
            )}
          </div>
          <button className="gp-start-btn" onClick={startGame}>
            ▶ Start Game
          </button>
        </div>
      )}

      {/* ---- PLAYING: CLASSIC / SURVIVAL ---- */}
      {phase === "playing" && (mode === "classic" || mode === "survival") && q && (
        <div className="gp-game">
          <a href="/games" className="gp-back">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Quit
          </a>
          <div className="gp-topbar">
            <span className="gp-progress-text">Question {idx + 1} of {totalQ}</span>
            <div className="gp-stats">
              {mode === "survival" && (
                <div className="gp-lives">
                  {[1,2,3].map(i => <span key={i} className={i <= lives ? "" : "lost"}>❤️</span>)}
                </div>
              )}
              <div className="gp-stat">
                <span className="gp-stat-label">Score</span>
                <span className="gp-stat-value">{score}</span>
              </div>
              <div className="gp-stat">
                <span className="gp-stat-label">Streak</span>
                <span className="gp-stat-value">🔥{streak}</span>
              </div>
              <div className={`gp-timer${timeLeft <= 5 ? " warning" : ""}`}>
                ⏱ {timeLeft}s
              </div>
            </div>
          </div>
          <div className="gp-progress-bar">
            <div className="gp-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="gp-question-card">
            <p className="gp-question-text">{q.question}</p>
          </div>
          <div className="gp-options">
            {q.options.map((opt, i) => {
              let cls = "gp-option";
              if (feedback && i === q.correctIndex) cls += " correct";
              if (feedback && selected === i && i !== q.correctIndex) cls += " wrong";
              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => handleAnswer(i)}
                  disabled={feedback}
                >
                  <span className="gp-option-letter">{"ABCD"[i]}</span>
                  {opt}
                </button>
              );
            })}
          </div>
          {feedback && q.explanation && (
            <div className="gp-explanation">
              💡 {q.explanation}
            </div>
          )}
        </div>
      )}

      {/* ---- PLAYING: SPEED ---- */}
      {phase === "playing" && mode === "speed" && q && (
        <div className="gp-game">
          <a href="/games" className="gp-back">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Quit
          </a>
          <div className={`gp-speed-timer${timeLeft <= 10 ? " warning" : ""}`}>
            {timeLeft}
          </div>
          <div className="gp-speed-score">
            Score: <b>{score}</b>
          </div>
          <div className="gp-question-card">
            <p className="gp-question-text">{q.question}</p>
          </div>
          <div className="gp-options">
            {q.options.map((opt, i) => (
              <button key={i} className="gp-option" onClick={() => handleAnswer(i)}>
                <span className="gp-option-letter">{"ABCD"[i]}</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- PLAYING: TRUE/FALSE ---- */}
      {phase === "playing" && mode === "truefalse" && q && (
        <div className="gp-game">
          <a href="/games" className="gp-back">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Quit
          </a>
          <div className="gp-topbar">
            <span className="gp-progress-text">Question {idx + 1} of {totalQ}</span>
            <div className="gp-stats">
              <div className="gp-stat">
                <span className="gp-stat-label">Score</span>
                <span className="gp-stat-value">{score}</span>
              </div>
              <div className="gp-stat">
                <span className="gp-stat-label">Streak</span>
                <span className="gp-stat-value">🔥{streak}</span>
              </div>
            </div>
          </div>
          <div className="gp-progress-bar">
            <div className="gp-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="gp-tf-statement">
            {getTFStatement()}
          </div>
          <div className="gp-tf-buttons">
            <button
              className={`gp-tf-btn true-btn${tfAnswer === true ? (tfIsTrue ? " correct" : " wrong") : ""}`}
              onClick={() => handleTF(true)}
              disabled={tfAnswer !== null}
            >
              ✓ True
            </button>
            <button
              className={`gp-tf-btn false-btn${tfAnswer === false ? (!tfIsTrue ? " correct" : " wrong") : ""}`}
              onClick={() => handleTF(false)}
              disabled={tfAnswer !== null}
            >
              ✗ False
            </button>
          </div>
        </div>
      )}

      {/* ---- PLAYING: MEMORY ---- */}
      {phase === "playing" && mode === "memory" && (
        <div className="gp-game">
          <a href="/games" className="gp-back">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Quit
          </a>
          <div className="gp-topbar">
            <span className="gp-progress-text">Match the pairs!</span>
            <div className="gp-stats">
              <div className="gp-stat">
                <span className="gp-stat-label">Pairs</span>
                <span className="gp-stat-value">{matched.length / 2} / {memCards.length / 2}</span>
              </div>
              <div className="gp-stat">
                <span className="gp-stat-label">Moves</span>
                <span className="gp-stat-value">{memMoves}</span>
              </div>
            </div>
          </div>
          <div className="gp-memory-grid">
            {memCards.map(card => {
              const isFlipped = flipped.includes(card.id);
              const isMatched = matched.includes(card.id);
              const showFace = isFlipped || isMatched;
              return (
                <button
                  key={card.id}
                  className={`gp-memory-card ${showFace ? (isMatched ? "matched" : "flipped") : "face-down"} ${showFace ? card.type + "-type" : ""}`}
                  onClick={() => handleMemoryClick(card.id)}
                  disabled={isMatched}
                >
                  {showFace ? card.content : ""}
                </button>
              );
            })}
          </div>
          <div className="gp-memory-stats">
            <span>⏱ {elapsedTime}s</span>
          </div>
        </div>
      )}

      {/* ---- RESULT ---- */}
      {phase === "result" && (
        <div className="gp-result">
          {stars >= 2 && <Confetti />}
          <div className="gp-result-stars">
            {[1,2,3].map(i => <span key={i}>{i <= stars ? "⭐" : "☆"}</span>)}
          </div>
          <div className="gp-result-score">{score}</div>
          <div className="gp-result-label">
            {stars === 3 ? "Perfect! 🎉" : stars === 2 ? "Great job! 👏" : stars === 1 ? "Good try! 💪" : "Keep practicing! 📚"}
          </div>
          <div className="gp-result-grid">
            <div className="gp-result-stat">
              <div className="gp-result-stat-value">{correct}/{mode === "memory" ? memCards.length / 2 : totalAnswered}</div>
              <div className="gp-result-stat-label">Correct</div>
            </div>
            <div className="gp-result-stat">
              <div className="gp-result-stat-value">{accuracyPct}%</div>
              <div className="gp-result-stat-label">Accuracy</div>
            </div>
            <div className="gp-result-stat">
              <div className="gp-result-stat-value">🔥{bestStreak}</div>
              <div className="gp-result-stat-label">Best Streak</div>
            </div>
            <div className="gp-result-stat">
              <div className="gp-result-stat-value">{elapsedTime || Math.floor((Date.now() - startTimeRef.current) / 1000)}s</div>
              <div className="gp-result-stat-label">Time</div>
            </div>
          </div>
          <div className="gp-result-actions">
            <button className="gp-btn gp-btn-primary" onClick={startGame}>
              🔄 Play Again
            </button>
            <a href="/games" className="gp-btn gp-btn-ghost">
              ← Back to Games
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
