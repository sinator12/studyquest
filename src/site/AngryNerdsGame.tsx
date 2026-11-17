import { useState, useEffect, useRef } from "react";
import TopNav from "./TopNav";
import { getActiveDeck, updatePlayerStats, type DeckInfo } from "./studyStore";
import { type Question } from "./quizData";
import "./angryNerds.css";

interface Grump {
  x: number;
  y: number;
  radius: number;
  alive: boolean;
  vx: number;
  vy: number;
}

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  vx: number;
  vy: number;
  angle: number;
  alive: boolean;
}

export default function AngryNerdsGame() {
  const [deck, setDeck] = useState<DeckInfo>(getActiveDeck());
  const [questions, setQuestions] = useState<Question[]>(deck.questions);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  const [showIntroModal, setShowIntroModal] = useState(true);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [fortLevel, setFortLevel] = useState(1);
  const [isNerdLoaded, setIsNerdLoaded] = useState(false);
  const [isPebble, setIsPebble] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<"idle" | "correct" | "wrong">("idle");
  const [fortCleared, setFortCleared] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentQ = questions[currentQIndex % questions.length];

  // Slingshot & Physics state inside ref to avoid re-renders during 60fps loop
  const gameState = useRef<{
    slingshotX: number;
    slingshotY: number;
    nerdX: number;
    nerdY: number;
    isDragging: boolean;
    isFlying: boolean;
    vx: number;
    vy: number;
    grumps: Grump[];
    blocks: Block[];
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    slingshotX: 140,
    slingshotY: 380,
    nerdX: 140,
    nerdY: 380,
    isDragging: false,
    isFlying: false,
    vx: 0,
    vy: 0,
    grumps: [],
    blocks: [],
    particles: []
  });

  // Setup Fort structure based on level
  const setupFort = (level: number) => {
    const s = gameState.current;
    s.isFlying = false;
    s.isDragging = false;
    s.nerdX = s.slingshotX;
    s.nerdY = s.slingshotY;
    s.vx = 0;
    s.vy = 0;

    const baseX = 460 + (level % 3) * 30;
    const groundY = 440;

    // Wood blocks and beams
    s.blocks = [
      { x: baseX, y: groundY - 60, width: 24, height: 60, color: "#D97706", vx: 0, vy: 0, angle: 0, alive: true },
      { x: baseX + 80, y: groundY - 60, width: 24, height: 60, color: "#D97706", vx: 0, vy: 0, angle: 0, alive: true },
      { x: baseX - 8, y: groundY - 78, width: 120, height: 18, color: "#B45309", vx: 0, vy: 0, angle: 0, alive: true },
      { x: baseX + 40, y: groundY - 138, width: 24, height: 60, color: "#D97706", vx: 0, vy: 0, angle: 0, alive: true }
    ];

    // Purple Grumps
    s.grumps = [
      { x: baseX + 40, y: groundY - 30, radius: 18, alive: true, vx: 0, vy: 0 },
      { x: baseX + 40, y: groundY - 160, radius: 18, alive: true, vx: 0, vy: 0 }
    ];
  };

  useEffect(() => {
    const d = getActiveDeck();
    setDeck(d);
    setQuestions(d.questions);
    setupFort(1);
  }, []);

  // 60FPS Game Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const s = gameState.current;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Draw Sky & Clouds
      ctx.clearRect(0, 0, width, height);
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, "#60A5FA");
      skyGrad.addColorStop(0.7, "#93C5FD");
      skyGrad.addColorStop(1, "#BAE6FD");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Clouds
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      ctx.arc(120, 90, 24, 0, Math.PI * 2);
      ctx.arc(146, 84, 30, 0, Math.PI * 2);
      ctx.arc(174, 90, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(420, 110, 22, 0, Math.PI * 2);
      ctx.arc(444, 104, 28, 0, Math.PI * 2);
      ctx.arc(470, 110, 20, 0, Math.PI * 2);
      ctx.fill();

      // Rolling Green Hills
      ctx.fillStyle = "#84CC16";
      ctx.beginPath();
      ctx.moveTo(0, 420);
      ctx.quadraticCurveTo(width * 0.25, 380, width * 0.5, 420);
      ctx.quadraticCurveTo(width * 0.75, 460, width, 410);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      ctx.fillStyle = "#65A30D";
      ctx.beginPath();
      ctx.moveTo(0, 440);
      ctx.quadraticCurveTo(width * 0.35, 410, width * 0.7, 445);
      ctx.quadraticCurveTo(width * 0.88, 460, width, 435);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Slingshot Fork
      const sx = s.slingshotX;
      const sy = s.slingshotY;
      ctx.strokeStyle = "#78350F";
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sx, 440);
      ctx.lineTo(sx, sy + 30);
      ctx.lineTo(sx - 16, sy);
      ctx.moveTo(sx, sy + 30);
      ctx.lineTo(sx + 16, sy);
      ctx.stroke();

      // Rubber Bands
      if (s.isDragging || isNerdLoaded) {
        ctx.strokeStyle = "#991B1B";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(sx - 16, sy);
        ctx.lineTo(s.nerdX, s.nerdY);
        ctx.lineTo(sx + 16, sy);
        ctx.stroke();
      }

      // Trajectory Prediction Dots
      if (s.isDragging) {
        const pullX = sx - s.nerdX;
        const pullY = sy - s.nerdY;
        let simX = s.nerdX;
        let simY = s.nerdY;
        let simVx = pullX * 0.18;
        let simVy = pullY * 0.18;

        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        for (let i = 0; i < 18; i++) {
          simX += simVx;
          simY += simVy;
          simVy += 0.45; // gravity
          ctx.beginPath();
          ctx.arc(simX, simY, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Blocks
      s.blocks.forEach(b => {
        if (!b.alive) return;
        ctx.save();
        ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
        ctx.rotate(b.angle);
        ctx.fillStyle = b.color;
        ctx.strokeStyle = "#78350F";
        ctx.lineWidth = 2;
        ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
        ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);
        ctx.restore();

        // Gravity on blocks
        if (b.y + b.height < 440) {
          b.vy += 0.35;
          b.y += b.vy;
          b.x += b.vx;
          b.angle += b.vx * 0.04;
        } else {
          b.y = 440 - b.height;
          b.vy = 0;
          b.vx *= 0.8;
        }
      });

      // Draw Purple Grumps
      s.grumps.forEach(g => {
        if (!g.alive) return;

        // Gravity
        if (g.y + g.radius < 440) {
          g.vy += 0.3;
          g.y += g.vy;
          g.x += g.vx;
        } else {
          g.y = 440 - g.radius;
          g.vy = 0;
          g.vx *= 0.8;
        }

        ctx.save();
        ctx.translate(g.x, g.y);

        // Body
        ctx.fillStyle = "#A855F7";
        ctx.strokeStyle = "#581C87";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, g.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Horns/Ears
        ctx.fillStyle = "#7E22CE";
        ctx.beginPath();
        ctx.moveTo(-10, -14);
        ctx.lineTo(-6, -24);
        ctx.lineTo(0, -16);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(10, -14);
        ctx.lineTo(6, -24);
        ctx.lineTo(0, -16);
        ctx.fill();

        // Surprised eyes
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.arc(-6, -2, 5, 0, Math.PI * 2);
        ctx.arc(6, -2, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(-6, -2, 2.5, 0, Math.PI * 2);
        ctx.arc(6, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // O-shaped mouth
        ctx.fillStyle = "#581C87";
        ctx.beginPath();
        ctx.ellipse(0, 8, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Update & Draw Flying Nerd / Pebble
      if (s.isFlying) {
        s.nerdX += s.vx;
        s.nerdY += s.vy;
        s.vy += 0.45; // Gravity

        // Ground collision
        if (s.nerdY >= 435) {
          s.nerdY = 435;
          s.vx *= 0.6;
          s.vy = -s.vy * 0.4;
          if (Math.abs(s.vx) < 0.5) {
            s.isFlying = false;
            setIsNerdLoaded(false);
          }
        }

        // Collision with Grumps
        s.grumps.forEach(g => {
          if (!g.alive) return;
          const dx = s.nerdX - g.x;
          const dy = s.nerdY - g.y;
          const dist = Math.hypot(dx, dy);

          if (dist < g.radius + 18) {
            // Hit!
            g.alive = false;
            const points = 330;
            setScore(sc => sc + points);
            setBestScore(bs => Math.max(bs, score + points));
            updatePlayerStats({ coins: 20 });

            // Spawn particles
            for (let i = 0; i < 16; i++) {
              s.particles.push({
                x: g.x,
                y: g.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: ["#A855F7", "#C084FC", "#F472B6", "#FDE047"][i % 4],
                life: 30
              });
            }

            // Check if all Grumps are cleared!
            const remaining = s.grumps.filter(gr => gr.alive);
            if (remaining.length === 0) {
              setFortCleared(true);
              setTimeout(() => {
                setFortCleared(false);
                setFortLevel(lvl => lvl + 1);
                setupFort(fortLevel + 1);
                setCurrentQIndex(qi => qi + 1);
                setAnswerState("idle");
                setSelectedAnswer(null);
              }, 2200);
            }
          }
        });

        // Collision with Blocks
        s.blocks.forEach(b => {
          if (!b.alive) return;
          if (
            s.nerdX > b.x &&
            s.nerdX < b.x + b.width &&
            s.nerdY > b.y &&
            s.nerdY < b.y + b.height
          ) {
            b.vx = s.vx * 0.5;
            b.vy = s.vy * 0.5;
            s.vx *= 0.4;
          }
        });
      }

      // Draw Nerd Bird (or Pebble)
      if (isNerdLoaded || s.isFlying) {
        ctx.save();
        ctx.translate(s.nerdX, s.nerdY);

        if (isPebble) {
          // Pebble
          ctx.fillStyle = "#71717A";
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Red Angry Nerd Bird
          ctx.fillStyle = "#EF4444";
          ctx.strokeStyle = "#991B1B";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Eyebrows (serious nerd look)
          ctx.strokeStyle = "#1F2937";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-12, -8);
          ctx.lineTo(-2, -4);
          ctx.moveTo(12, -8);
          ctx.lineTo(2, -4);
          ctx.stroke();

          // Big Nerd Glasses
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 2.5;
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.beginPath();
          ctx.arc(-6, -2, 6, 0, Math.PI * 2);
          ctx.arc(6, -2, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, -2);
          ctx.lineTo(0, -2);
          ctx.stroke();

          // Pupils
          ctx.fillStyle = "#000";
          ctx.beginPath();
          ctx.arc(-5, -2, 2.5, 0, Math.PI * 2);
          ctx.arc(7, -2, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Yellow Beak
          ctx.fillStyle = "#F59E0B";
          ctx.beginPath();
          ctx.moveTo(0, 2);
          ctx.lineTo(8, 6);
          ctx.lineTo(0, 9);
          ctx.fill();
        }
        ctx.restore();
      }

      // Update & Render Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isNerdLoaded, isPebble, fortLevel, score]);

  // Slingshot drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isNerdLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const s = gameState.current;
    const dist = Math.hypot(x - s.slingshotX, y - s.slingshotY);
    if (dist < 80) {
      s.isDragging = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = gameState.current;
    if (!s.isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Constrain pull distance
    const dx = x - s.slingshotX;
    const dy = y - s.slingshotY;
    const angle = Math.atan2(dy, dx);
    const maxPull = 90;
    const dist = Math.min(Math.hypot(dx, dy), maxPull);

    s.nerdX = s.slingshotX + Math.cos(angle) * dist;
    s.nerdY = s.slingshotY + Math.sin(angle) * dist;
  };

  const handleMouseUp = () => {
    const s = gameState.current;
    if (!s.isDragging) return;
    s.isDragging = false;
    s.isFlying = true;

    // Compute velocity
    const pullX = s.slingshotX - s.nerdX;
    const pullY = s.slingshotY - s.nerdY;
    s.vx = pullX * 0.22;
    s.vy = pullY * 0.22;
  };

  const handleAnswerClick = (optionIdx: number) => {
    if (!currentQ || answerState !== "idle") return;
    setSelectedAnswer(optionIdx);

    const isCorrect = optionIdx === currentQ.correctIndex;
    if (isCorrect) {
      setAnswerState("correct");
      setIsNerdLoaded(true);
      setIsPebble(false);
      gameState.current.nerdX = gameState.current.slingshotX;
      gameState.current.nerdY = gameState.current.slingshotY;
    } else {
      setAnswerState("wrong");
      setIsNerdLoaded(true);
      setIsPebble(true); // Loads a weak pebble
      gameState.current.nerdX = gameState.current.slingshotX;
      gameState.current.nerdY = gameState.current.slingshotY;
    }
  };

  const grumpsLeft = gameState.current.grumps.filter(g => g.alive).length;

  return (
    <div className="sq-nerds-app">
      <TopNav activeTab="games" />

      {/* ---------------- INTRO MODAL (Exact match from video frame 016) ---------------- */}
      {showIntroModal && (
        <div className="sq-nerds-modal-overlay">
          <div className="sq-nerds-intro-modal">
            <h2>Angry Nerds</h2>
            <p className="sq-nerds-intro-sub">
              The Grumps stole your notes and built forts out of them. Fling the Nerds!
            </p>

            <div className="sq-nerds-features-grid">
              {/* Card 1 */}
              <div className="sq-nerd-feature-card">
                <div className="sq-feature-avatar red-nerd">🤓</div>
                <h4>Answer to load a Nerd</h4>
                <p>A right answer puts a Nerd on the slingshot. A wrong one gives you a little pebble.</p>
              </div>

              {/* Card 2 */}
              <div className="sq-nerd-feature-card">
                <div className="sq-feature-avatar yellow-nerd">🎯</div>
                <h4>Pull back and fling</h4>
                <p>Drag anywhere, let go to launch. Aim carefully at the wood blocks. No timers.</p>
              </div>

              {/* Card 3 */}
              <div className="sq-nerd-feature-card">
                <div className="sq-feature-avatar purple-grump">👾</div>
                <h4>Knock the Grumps down</h4>
                <p>Clear every Grump to win the fort. Streaks of right answers earn stronger Nerds.</p>
              </div>
            </div>

            <button
              type="button"
              className="sq-nerds-launch-btn"
              onClick={() => setShowIntroModal(false)}
            >
              Let's fling!
            </button>
          </div>
        </div>
      )}

      {/* ---------------- MAIN GAMEPLAY ---------------- */}
      <main className="sq-nerds-main-grid">
        {/* LEFT COLUMN: Question & Slingshot Ammo Loader */}
        <section className="sq-nerds-left-panel">
          <div className="sq-nerds-header-row">
            <a href="/games" className="sq-nerds-back-link">←</a>
            <h3>Angry Nerds</h3>
          </div>

          <div className="sq-nerds-stats-bar">
            <div className="sq-nstat">
              <span className="lbl">SCORE</span>
              <span className="val">{score}</span>
            </div>
            <div className="sq-nstat">
              <span className="lbl">BEST</span>
              <span className="val">{bestScore}</span>
            </div>
            <div className="sq-nstat fort-stat">
              <span className="lbl">FORT {fortLevel}</span>
              <span className="grump-left">👾 {grumpsLeft} left</span>
            </div>
            <div className="sq-nstars">⭐⭐⭐⭐</div>
          </div>

          <div className="sq-ammo-prompt-box">
            <span className="sq-ammo-badge">ANSWER TO LOAD THE SLINGSHOT</span>
            {currentQ && (
              <>
                <h4 className="sq-ammo-question">{currentQ.question}</h4>
                <div className="sq-ammo-options-list">
                  {currentQ.options.map((option, i) => {
                    const isSelected = selectedAnswer === i;
                    const isCorrect = i === currentQ.correctIndex;
                    let cls = "sq-ammo-btn";
                    if (answerState !== "idle") {
                      if (isCorrect) cls += " correct";
                      else if (isSelected) cls += " wrong";
                    }

                    return (
                      <button
                        key={i}
                        type="button"
                        className={cls}
                        onClick={() => handleAnswerClick(i)}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {isNerdLoaded && (
              <div className="sq-loaded-callout">
                {isPebble ? "Pebble loaded! Aim carefully." : "✓ Your Nerd is loaded. Pull back and let go!"}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Physics Slingshot Canvas */}
        <section className="sq-nerds-right-canvas-panel">
          {fortCleared && (
            <div className="sq-fort-cleared-banner">
              <h2>Fort cleared! 🎉</h2>
              <p>+330 Fort Bonus! Setting up next target...</p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={720}
            height={520}
            className="sq-nerds-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />

          <div className="sq-canvas-instructions">
            <span>🖱️ Click & drag slingshot back to aim • Release to fling!</span>
          </div>
        </section>
      </main>
    </div>
  );
}
