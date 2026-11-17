import { useState, useEffect, useRef } from "react";
import TopNav from "./TopNav";
import { getActiveDeck, updatePlayerStats, type DeckInfo } from "./studyStore";
import { type Question } from "./quizData";
import "./angryNerds.css";

interface Grump {
  id: number;
  x: number;
  y: number;
  radius: number;
  alive: boolean;
  vx: number;
  vy: number;
  squish: number;
}

interface Block {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  borderColor: string;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  alive: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  vy: number;
  opacity: number;
  color: string;
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
  const [ammoStatusText, setAmmoStatusText] = useState("Select an answer to load the slingshot!");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentQ = questions.length > 0 ? questions[currentQIndex % questions.length] : null;

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
    particles: Particle[];
    floatingTexts: FloatingText[];
  }>({
    slingshotX: 160,
    slingshotY: 380,
    nerdX: 160,
    nerdY: 380,
    isDragging: false,
    isFlying: false,
    vx: 0,
    vy: 0,
    grumps: [],
    blocks: [],
    particles: [],
    floatingTexts: []
  });

  // Setup Fort structure exactly inspired by Frame 019
  const setupFort = (level: number) => {
    const s = gameState.current;
    s.isFlying = false;
    s.isDragging = false;
    s.nerdX = s.slingshotX;
    s.nerdY = s.slingshotY;
    s.vx = 0;
    s.vy = 0;
    s.particles = [];
    s.floatingTexts = [];

    const baseX = 520;
    const groundY = 445;

    // Structure matching Frame 019: 3 vertical wooden pillars + lintels + purple grump
    if (level % 2 === 1) {
      // Classic 3-pillar fort with Grump inside
      s.blocks = [
        // Base foundation beam
        { id: 1, x: baseX - 10, y: groundY - 14, width: 140, height: 14, color: "#92400E", borderColor: "#78350F", vx: 0, vy: 0, angle: 0, angularVelocity: 0, alive: true },
        // Left pillar
        { id: 2, x: baseX, y: groundY - 80, width: 22, height: 66, color: "#D97706", borderColor: "#B45309", vx: 0, vy: 0, angle: 0, angularVelocity: 0, alive: true },
        // Middle pillar
        { id: 3, x: baseX + 48, y: groundY - 96, width: 22, height: 82, color: "#B45309", borderColor: "#78350F", vx: 0, vy: 0, angle: 0, angularVelocity: 0, alive: true },
        // Right pillar
        { id: 4, x: baseX + 96, y: groundY - 80, width: 22, height: 66, color: "#D97706", borderColor: "#B45309", vx: 0, vy: 0, angle: 0, angularVelocity: 0, alive: true },
        // Crossbeam top
        { id: 5, x: baseX - 4, y: groundY - 98, width: 128, height: 16, color: "#F59E0B", borderColor: "#B45309", vx: 0, vy: 0, angle: 0, angularVelocity: 0, alive: true },
        // Top cap stone / triangle block
        { id: 6, x: baseX + 42, y: groundY - 130, width: 34, height: 32, color: "#EA580C", borderColor: "#9A3412", vx: 0, vy: 0, angle: 0, angularVelocity: 0, alive: true }
      ];

      // Grump resting safely between pillars (matching Frame 019 position)
      s.grumps = [
        { id: 1, x: baseX + 72, y: groundY - 45, radius: 19, alive: true, vx: 0, vy: 0, squish: 1 }
      ];
    } else {
      // 2-tier Fort for higher levels
      s.blocks = [
        // Level 2 Fort: Dual story fort with 2 grumps
        { id: 1, x: baseX - 15, y: groundY - 14, width: 160, height: 14, color: "#92400E", borderColor: "#78350F", vx: 0, vy: 0, angle: 0, angularVelocity: 0, alive: true },
        { id: 2, x: baseX, y: groundY - 76, width: 22, height: 62, color: "#D97706", borderColor: "#B45309", vx: 0, vy: 0, angle: 0, angularVelocity: 0, alive: true },
        { id: 3, x: baseX + 54, y: groundY - 76, width: 22, height: 62, color: "#D97706", borderColor: "#B45309", vx: 0, vy: 0, angle: 0, angularVelocity: 0, alive: true },
        { id: 4, x: baseX + 108, y: groundY - 76, width: 22, height: 62, color: "#D97706", borderColor: "#B45309", vx: 0, vy: 0, angle: 0, angularVelocity: 0, alive: true },
        // Deck
        { id: 5, x: baseX - 8, y: groundY - 92, width: 146, height: 16, color: "#F59E0B", borderColor: "#B45309", vx: 0, vy: 0, angle: 0, angularVelocity: 0, alive: true },
        // Upper floor
        { id: 6, x: baseX + 26, y: groundY - 152, width: 20, height: 60, color: "#B45309", borderColor: "#78350F", vx: 0, vy: 0, angle: 0, angularVelocity: 0, alive: true },
        { id: 7, x: baseX + 84, y: groundY - 152, width: 20, height: 60, color: "#B45309", borderColor: "#78350F", vx: 0, vy: 0, angle: 0, angularVelocity: 0, alive: true },
        { id: 8, x: baseX + 20, y: groundY - 168, width: 90, height: 16, color: "#EA580C", borderColor: "#9A3412", vx: 0, vy: 0, angle: 0, angularVelocity: 0, alive: true }
      ];

      s.grumps = [
        { id: 1, x: baseX + 28, y: groundY - 45, radius: 18, alive: true, vx: 0, vy: 0, squish: 1 },
        { id: 2, x: baseX + 65, y: groundY - 124, radius: 18, alive: true, vx: 0, vy: 0, squish: 1 }
      ];
    }
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

      // 1. SKY GRADIENT (Exact match from Frame 019: #62A6FB at top -> #9ECFF7 at horizon)
      ctx.clearRect(0, 0, width, height);
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, "#62A6FB");
      skyGrad.addColorStop(0.5, "#7BB7FC");
      skyGrad.addColorStop(0.85, "#9ECFF7");
      skyGrad.addColorStop(1, "#BAE6FD");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. CLOUDS (Exact Frame 019 positions and shapes: Cloud 1 around 167,100; Cloud 2 around 489,122)
      // Cloud 1
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.beginPath();
      ctx.arc(130, 95, 26, 0, Math.PI * 2);
      ctx.arc(162, 85, 34, 0, Math.PI * 2);
      ctx.arc(196, 95, 24, 0, Math.PI * 2);
      ctx.arc(165, 108, 20, 0, Math.PI * 2);
      ctx.fill();

      // Cloud 2
      ctx.beginPath();
      ctx.arc(460, 118, 24, 0, Math.PI * 2);
      ctx.arc(488, 110, 30, 0, Math.PI * 2);
      ctx.arc(518, 118, 22, 0, Math.PI * 2);
      ctx.arc(490, 130, 18, 0, Math.PI * 2);
      ctx.fill();

      // 3. LAYERED ROLLING GREEN HILLS (Frame 019)
      // Back Hill (Deeper Olive Green #4E8E13)
      ctx.fillStyle = "#4E8E13";
      ctx.beginPath();
      ctx.moveTo(0, 420);
      ctx.quadraticCurveTo(width * 0.35, 395, width * 0.65, 430);
      ctx.quadraticCurveTo(width * 0.85, 450, width, 415);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Front Hill (Vibrant Lawn Green #64A30C with Highlight Rim #86CA1B)
      ctx.fillStyle = "#64A30C";
      ctx.beginPath();
      ctx.moveTo(0, 442);
      ctx.quadraticCurveTo(width * 0.28, 432, width * 0.55, 445);
      ctx.quadraticCurveTo(width * 0.8, 452, width, 438);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Grassy highlight stripe along the rim
      ctx.strokeStyle = "#86CA1B";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 442);
      ctx.quadraticCurveTo(width * 0.28, 432, width * 0.55, 445);
      ctx.quadraticCurveTo(width * 0.8, 452, width, 438);
      ctx.stroke();

      // 4. SLINGSHOT POST (Frame 019: Wooden Y-shaped slingshot post on the hill)
      const sx = s.slingshotX;
      const sy = s.slingshotY;

      // Wooden Post Trunk
      ctx.save();
      ctx.strokeStyle = "#3E1E07";
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Shadow / Outline
      ctx.beginPath();
      ctx.moveTo(sx, 448);
      ctx.lineTo(sx, sy + 32);
      ctx.lineTo(sx - 18, sy);
      ctx.moveTo(sx, sy + 32);
      ctx.lineTo(sx + 18, sy);
      ctx.stroke();

      // Inner Wood Body
      ctx.strokeStyle = "#78350F";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(sx, 447);
      ctx.lineTo(sx, sy + 32);
      ctx.lineTo(sx - 18, sy);
      ctx.moveTo(sx, sy + 32);
      ctx.lineTo(sx + 18, sy);
      ctx.stroke();

      // Wood Grain Highlight
      ctx.strokeStyle = "#92400E";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx - 1, 445);
      ctx.lineTo(sx - 1, sy + 33);
      ctx.stroke();
      ctx.restore();

      // Rubber Bands & Elastic Pouch
      if (s.isDragging || isNerdLoaded || s.isFlying) {
        ctx.save();
        ctx.strokeStyle = "#881337";
        ctx.lineWidth = 4.5;
        ctx.lineCap = "round";

        // Back Band (to left fork tip)
        ctx.beginPath();
        ctx.moveTo(sx - 18, sy);
        ctx.lineTo(s.nerdX, s.nerdY);
        ctx.stroke();

        // Front Band (to right fork tip)
        ctx.beginPath();
        ctx.moveTo(sx + 18, sy);
        ctx.lineTo(s.nerdX, s.nerdY);
        ctx.stroke();

        // Leather Pouch
        ctx.fillStyle = "#451A03";
        ctx.beginPath();
        ctx.ellipse(s.nerdX, s.nerdY, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Trajectory Prediction Dots (When pulling back the slingshot)
      if (s.isDragging) {
        const pullX = sx - s.nerdX;
        const pullY = sy - s.nerdY;
        let simX = s.nerdX;
        let simY = s.nerdY;
        let simVx = pullX * 0.22;
        let simVy = pullY * 0.22;

        for (let i = 0; i < 22; i++) {
          simX += simVx;
          simY += simVy;
          simVy += 0.46; // Gravity

          ctx.fillStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.9)" : "rgba(254, 240, 138, 0.75)";
          ctx.beginPath();
          const dotRadius = Math.max(1.8, 4.5 - i * 0.12);
          ctx.arc(simX, simY, dotRadius, 0, Math.PI * 2);
          ctx.fill();

          if (simY > 445) break; // Reached ground
        }
      }

      // 5. DRAW FORT BLOCKS
      s.blocks.forEach(b => {
        if (!b.alive) return;
        ctx.save();
        ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
        ctx.rotate(b.angle);

        // Block Body
        ctx.fillStyle = b.color;
        ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);

        // Block Border / Wood Bevel
        ctx.strokeStyle = b.borderColor;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);

        // Subtle wood planks inner lines
        ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
        ctx.lineWidth = 1.5;
        if (b.height > b.width) {
          ctx.beginPath();
          ctx.moveTo(-b.width / 6, -b.height / 2);
          ctx.lineTo(-b.width / 6, b.height / 2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(-b.width / 2, 0);
          ctx.lineTo(b.width / 2, 0);
          ctx.stroke();
        }

        ctx.restore();

        // Physics on blocks
        if (b.y + b.height < 445) {
          b.vy += 0.42; // Gravity
          b.y += b.vy;
          b.x += b.vx;
          b.angle += b.angularVelocity;
          b.vx *= 0.98;
        } else {
          b.y = 445 - b.height;
          b.vy = -b.vy * 0.25;
          b.vx *= 0.85;
          b.angularVelocity *= 0.8;
          if (Math.abs(b.vy) < 0.2) b.vy = 0;
        }
      });

      // 6. DRAW PURPLE GRUMP MONSTERS (Exact match from Frame 019)
      s.grumps.forEach(g => {
        if (!g.alive) return;

        // Grump Gravity & Position
        if (g.y + g.radius < 445) {
          g.vy += 0.38;
          g.y += g.vy;
          g.x += g.vx;
          g.vx *= 0.98;
        } else {
          g.y = 445 - g.radius;
          g.vy = 0;
          g.vx *= 0.85;
        }

        ctx.save();
        ctx.translate(g.x, g.y);

        // Shadow on ground
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.beginPath();
        ctx.ellipse(0, g.radius - 2, g.radius * 0.9, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Purple Horns / Tufts (pointed ears on top)
        ctx.fillStyle = "#6B21A8";
        ctx.beginPath();
        ctx.moveTo(-11, -12);
        ctx.lineTo(-7, -26);
        ctx.lineTo(-2, -16);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(11, -12);
        ctx.lineTo(7, -26);
        ctx.lineTo(2, -16);
        ctx.fill();

        // Round Purple Monster Body (Frame 019: #9333EA / #A855F7)
        ctx.fillStyle = "#9333EA";
        ctx.strokeStyle = "#581C87";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, g.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Monster Eyebrows (Worried / surprised look)
        ctx.strokeStyle = "#3B0764";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-9, -9);
        ctx.lineTo(-3, -7);
        ctx.moveTo(9, -9);
        ctx.lineTo(3, -7);
        ctx.stroke();

        // Big Round Surprised White Eyes
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(-6, -2, 5.5, 0, Math.PI * 2);
        ctx.arc(6, -2, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#3B0764";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Pupils looking at slingshot
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(-8, -2, 2.5, 0, Math.PI * 2);
        ctx.arc(4, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Open O-shaped mouth (:O)
        ctx.fillStyle = "#4A044E";
        ctx.beginPath();
        ctx.ellipse(0, 8, 4.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#701A75";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cute Rosy Cheeks
        ctx.fillStyle = "rgba(244, 114, 182, 0.4)";
        ctx.beginPath();
        ctx.arc(-11, 4, 3, 0, Math.PI * 2);
        ctx.arc(11, 4, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // 7. UPDATE & DRAW FLYING NERD BIRD OR PEBBLE
      if (s.isFlying) {
        s.nerdX += s.vx;
        s.nerdY += s.vy;
        s.vy += 0.46; // Gravity

        // Ground bounce
        if (s.nerdY >= 440) {
          s.nerdY = 440;
          s.vx *= 0.65;
          s.vy = -s.vy * 0.42;

          // Spawn ground dirt particles
          for (let p = 0; p < 2; p++) {
            s.particles.push({
              x: s.nerdX,
              y: s.nerdY,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 3,
              color: "#64A30C",
              size: 3,
              life: 18,
              maxLife: 18
            });
          }

          if (Math.abs(s.vx) < 0.6 && Math.abs(s.vy) < 0.6) {
            s.isFlying = false;
            setIsNerdLoaded(false);
            setAmmoStatusText("Shot completed! Answer the next question to reload!");
          }
        }

        // Collision with Grumps
        s.grumps.forEach(g => {
          if (!g.alive) return;
          const dx = s.nerdX - g.x;
          const dy = s.nerdY - g.y;
          const dist = Math.hypot(dx, dy);

          if (dist < g.radius + 18) {
            // DIRECT HIT ON GRUMP!
            g.alive = false;
            const points = 330;
            setScore(sc => sc + points);
            setBestScore(bs => Math.max(bs, score + points));
            updatePlayerStats({ coins: 25 });

            // Floating Score text
            s.floatingTexts.push({
              id: Date.now() + Math.random(),
              text: "+330",
              x: g.x,
              y: g.y - 10,
              vy: -2,
              opacity: 1,
              color: "#FDE047"
            });

            // Explosion particle burst
            for (let i = 0; i < 28; i++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 2 + Math.random() * 7;
              s.particles.push({
                x: g.x,
                y: g.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                color: ["#A855F7", "#C084FC", "#E879F9", "#FDE047", "#FFFFFF"][i % 5],
                size: 4 + Math.random() * 3,
                life: 36,
                maxLife: 36
              });
            }

            // Deflect bird slightly
            s.vx *= 0.5;
            s.vy = -s.vy * 0.4;

            // Check if fort is fully cleared
            const remaining = s.grumps.filter(gr => gr.alive);
            if (remaining.length === 0) {
              setFortCleared(true);
              setAmmoStatusText("🎉 Fort Cleared! Loading next level...");
              setTimeout(() => {
                setFortCleared(false);
                setFortLevel(lvl => lvl + 1);
                setupFort(fortLevel + 1);
                setCurrentQIndex(qi => qi + 1);
                setAnswerState("idle");
                setSelectedAnswer(null);
                setAmmoStatusText("Answer the question to load your slingshot!");
              }, 2200);
            }
          }
        });

        // Collision with Wood Blocks
        s.blocks.forEach(b => {
          if (!b.alive) return;
          const hitPadding = 14;
          if (
            s.nerdX > b.x - hitPadding &&
            s.nerdX < b.x + b.width + hitPadding &&
            s.nerdY > b.y - hitPadding &&
            s.nerdY < b.y + b.height + hitPadding
          ) {
            // Apply impact impulse to block
            b.vx = s.vx * 0.65;
            b.vy = s.vy * 0.45;
            b.angularVelocity = (s.vx > 0 ? 0.08 : -0.08) * (Math.random() + 0.5);

            // Wood splinter particles
            for (let i = 0; i < 6; i++) {
              s.particles.push({
                x: s.nerdX,
                y: s.nerdY,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: ["#D97706", "#B45309", "#78350F"][i % 3],
                size: 3,
                life: 20,
                maxLife: 20
              });
            }

            // Slow down bird
            s.vx *= 0.45;
            s.vy = s.vy * 0.3 - 1.5;
          }
        });
      }

      // Draw Loaded / Flying Projectile (Angry Nerd Bird or Pebble)
      if (isNerdLoaded || s.isFlying) {
        ctx.save();
        ctx.translate(s.nerdX, s.nerdY);

        if (isPebble) {
          // Practice Pebble
          ctx.fillStyle = "#64748B";
          ctx.strokeStyle = "#334155";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          // RED ANGRY NERD BIRD
          // Red Bird Body
          ctx.fillStyle = "#DC2626";
          ctx.strokeStyle = "#991B1B";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Determined Furrowed Eyebrows
          ctx.strokeStyle = "#1F2937";
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-11, -8);
          ctx.lineTo(-2, -4);
          ctx.moveTo(11, -8);
          ctx.lineTo(2, -4);
          ctx.stroke();

          // Black Nerd Glasses Frames
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2.5;
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.beginPath();
          ctx.arc(-6, -2, 6, 0, Math.PI * 2);
          ctx.arc(6, -2, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Glasses Bridge
          ctx.beginPath();
          ctx.moveTo(-1, -2);
          ctx.lineTo(1, -2);
          ctx.stroke();

          // Pupils
          ctx.fillStyle = "#000000";
          ctx.beginPath();
          ctx.arc(-5, -2, 2.5, 0, Math.PI * 2);
          ctx.arc(7, -2, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Yellow Beak
          ctx.fillStyle = "#F59E0B";
          ctx.strokeStyle = "#B45309";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-1, 3);
          ctx.lineTo(8, 6);
          ctx.lineTo(-1, 9);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      }

      // 8. UPDATE & RENDER PARTICLES
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      // 9. UPDATE & RENDER FLOATING SCORE TEXT
      for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
        const ft = s.floatingTexts[i];
        ft.y += ft.vy;
        ft.opacity -= 0.025;
        ctx.font = "bold 24px 'Gabarito', sans-serif";
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.opacity);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x - 20, ft.y);
        ctx.fillText(ft.text, ft.x - 20, ft.y);
        ctx.globalAlpha = 1.0;
        if (ft.opacity <= 0) s.floatingTexts.splice(i, 1);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isNerdLoaded, isPebble, fortLevel, score]);

  // Slingshot drag handlers with coordinate scaling for all display ratios
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStartDrag = (clientX: number, clientY: number) => {
    if (!isNerdLoaded) return;
    const { x, y } = getCanvasCoords(clientX, clientY);
    const s = gameState.current;
    const dist = Math.hypot(x - s.slingshotX, y - s.slingshotY);
    if (dist < 90) {
      s.isDragging = true;
      s.nerdX = x;
      s.nerdY = y;
    }
  };

  const handleMoveDrag = (clientX: number, clientY: number) => {
    const s = gameState.current;
    if (!s.isDragging) return;
    const { x, y } = getCanvasCoords(clientX, clientY);

    // Constrain pull distance from slingshot fork
    const dx = x - s.slingshotX;
    const dy = y - s.slingshotY;
    const angle = Math.atan2(dy, dx);
    const maxPull = 95;
    const dist = Math.min(Math.hypot(dx, dy), maxPull);

    s.nerdX = s.slingshotX + Math.cos(angle) * dist;
    s.nerdY = s.slingshotY + Math.sin(angle) * dist;
  };

  const handleEndDrag = () => {
    const s = gameState.current;
    if (!s.isDragging) return;
    s.isDragging = false;
    s.isFlying = true;

    // Launch velocity proportional to pull distance
    const pullX = s.slingshotX - s.nerdX;
    const pullY = s.slingshotY - s.nerdY;
    s.vx = pullX * 0.23;
    s.vy = pullY * 0.23;
    setAmmoStatusText("Flinging! Watch it smash the fort!");
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => handleStartDrag(e.clientX, e.clientY);
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => handleMoveDrag(e.clientX, e.clientY);
  const handleMouseUp = () => handleEndDrag();

  // Touch events for tablets/mobiles
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) handleMoveDrag(e.touches[0].clientX, e.touches[0].clientY);
  };
  const handleTouchEnd = () => handleEndDrag();

  // Question answering logic
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
      setAmmoStatusText("✓ Red Nerd loaded! Click & drag the slingshot back to fling!");
    } else {
      setAnswerState("wrong");
      setIsNerdLoaded(true);
      setIsPebble(true);
      gameState.current.nerdX = gameState.current.slingshotX;
      gameState.current.nerdY = gameState.current.slingshotY;
      setAmmoStatusText("Pebble loaded! Drag back to fling, or review your notes!");
    }
  };

  const handleNextQuestion = () => {
    setCurrentQIndex(i => i + 1);
    setAnswerState("idle");
    setSelectedAnswer(null);
    setIsNerdLoaded(false);
    gameState.current.isFlying = false;
    gameState.current.nerdX = gameState.current.slingshotX;
    gameState.current.nerdY = gameState.current.slingshotY;
    setAmmoStatusText("Select an answer to load the slingshot!");
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
            <div className="sq-ammo-badge-row">
              <span className="sq-ammo-badge">QUESTION {currentQIndex + 1} OF {questions.length}</span>
              {answerState !== "idle" && (
                <button
                  type="button"
                  className="sq-skip-q-btn"
                  onClick={handleNextQuestion}
                >
                  Next Question →
                </button>
              )}
            </div>

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
                        <span className="sq-option-key">{String.fromCharCode(65 + i)}</span>
                        <span className="sq-option-label">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className={`sq-loaded-callout ${isNerdLoaded ? (isPebble ? "pebble" : "nerd") : "hint"}`}>
              {ammoStatusText}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Physics Slingshot Canvas (Matching Frame 019) */}
        <section className="sq-nerds-right-canvas-panel">
          {fortCleared && (
            <div className="sq-fort-cleared-banner">
              <h2>Fort cleared! 🎉</h2>
              <p>+330 Fort Bonus! Setting up next target...</p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={786}
            height={520}
            className="sq-nerds-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          <div className="sq-canvas-instructions">
            <span>🖱️ Click & drag slingshot back to aim • Release to fling!</span>
          </div>
        </section>
      </main>
    </div>
  );
}
