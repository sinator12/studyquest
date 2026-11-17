import { useState, useEffect, useRef, useCallback } from "react";
import { getActiveDeck, addXp, recordActivityToday, type DeckInfo } from "./studyStore";
import { type Question } from "./quizData";
import TopNav from "./TopNav";
import "./bingoNight.css";

/* ------------------------------------------------------------------ */
/*  1. Provided Customer Characters as Bingo Callers & Regulars       */
/* ------------------------------------------------------------------ */
export interface BingoCharacter {
  id: string;
  name: string;
  title: string;
  imageSrc: string;
  callQuote: string;
  correctQuote: string;
  missQuote: string;
  bingoQuote: string;
}

export const BINGO_CHARACTERS: BingoCharacter[] = [
  {
    id: "chopper",
    name: "Tony Tony Chopper",
    title: "HALL CALLER & DOCTOR",
    imageSrc: "/games/study-cafe/customer_chopper.png",
    callQuote: "Shake it up, shake it up! The next ball is rolling out!",
    correctQuote: "Hehehe! Calling me a genius won't make me happy, you bastard! STAMP IT!",
    missQuote: "Wahhh! That wasn't the right answer! The ball rolls back into the cage!",
    bingoQuote: "WOOOOW!! FIVE IN A ROW!! BINGO!! YOU DID IT!!"
  },
  {
    id: "luffy",
    name: "Straw Hat Luffy",
    title: "PIRATE CALLER",
    imageSrc: "/games/study-cafe/customer_luffy.png",
    callQuote: "Round and round she goes! Who's ready for a lucky ball?!",
    correctQuote: "SUGEEE! That's totally on your card! Smash that stamp!",
    missQuote: "EHHHH?! Wrong ball! Back in the cage it goes!",
    bingoQuote: "SHISHISHI! BIIINGOOOO! Best game on the whole Grand Line!"
  },
  {
    id: "shanks",
    name: "Red-Haired Shanks",
    title: "YONKO CAPTAIN",
    imageSrc: "/games/study-cafe/customer_shanks.png",
    callQuote: "Dahahaha! Focus your mind and let's see what the hall has for you.",
    correctQuote: "Outstanding recall! That answer is pure mastery. Stamp your square!",
    missQuote: "No worries! Even great pirates miss. Shake it off and try the next ball.",
    bingoQuote: "Dahahaha! Glorious BINGO! A true champion of StudyQuest!"
  },
  {
    id: "zoro",
    name: "Roronoa Zoro",
    title: "SWORDSMAN CALLER",
    imageSrc: "/games/study-cafe/customer_zoro.png",
    callQuote: "Oi, don't get lost in the numbers. Eyes on the tumbler!",
    correctQuote: "Clean cut! Sharp as three blades. Hit that card square!",
    missQuote: "Tch! Missed the target. Focus up on the next one.",
    bingoQuote: "Hmph, not bad at all. A flawless line — that's BINGO!"
  },
  {
    id: "giorno",
    name: "Giorno Giovanna",
    title: "PASSIONE BOSS",
    imageSrc: "/games/study-cafe/customer_giorno.png",
    callQuote: "I, Giorno Giovanna, spin the wheel of golden destiny.",
    correctQuote: "That answer carries true resolve. Gold Experience blesses your card!",
    missQuote: "Muda! That answer lacked resolve. Learn from this moment.",
    bingoQuote: "Golden BINGO! Your victory was destined from the start."
  },
  {
    id: "gyro",
    name: "Gyro Zeppeli",
    title: "STEEL BALL RUNNER",
    imageSrc: "/games/study-cafe/customer_gyro.png",
    callQuote: "Nyo-ho! Witness the Golden Ratio of the spinning bingo cage!",
    correctQuote: "Nyo-ho-ho! Perfect rotation! That stamp landed right on the money!",
    missQuote: "Lesson 1: You calculated the spin wrong. Wait for the next roll!",
    bingoQuote: "GOLDEN ROTATION BINGO! Nyo-ho! Unstoppable technique!"
  }
];

/* ------------------------------------------------------------------ */
/*  2. Exact Reference Sample Questions & 5x5 Grid Items              */
/* ------------------------------------------------------------------ */
const BINGO_SAMPLE_QUESTIONS: Question[] = [
  {
    id: 101,
    subject: "math",
    question: "What is 15% of 200?",
    options: ["30", "15", "40", "20"],
    correctIndex: 0,
    explanation: "15% of 200 is calculated as 0.15 × 200 = 30."
  },
  {
    id: 102,
    subject: "science",
    question: "What is the main component of the Sun?",
    options: ["Nitrogen", "Hydrogen", "Oxygen", "Helium"],
    correctIndex: 1,
    explanation: "The Sun is composed primarily of hydrogen (about 73%) and helium (about 25%)."
  },
  {
    id: 103,
    subject: "math",
    question: "What is the square root of 144?",
    options: ["16", "14", "10", "12"],
    correctIndex: 3,
    explanation: "12 × 12 = 144, so the square root of 144 is 12."
  },
  {
    id: 104,
    subject: "science",
    question: "What is the chemical symbol for gold?",
    options: ["Ag", "Cu", "Au", "Fe"],
    correctIndex: 2,
    explanation: "Au comes from the Latin word for gold, 'aurum'."
  },
  {
    id: 105,
    subject: "general",
    question: "Which of these instruments is played by blowing air?",
    options: ["Violin", "Guitar", "Flute", "Drum"],
    correctIndex: 2,
    explanation: "A flute is a woodwind instrument played by directing an airstream across an opening."
  },
  {
    id: 106,
    subject: "geography",
    question: "Which continent is Brazil in?",
    options: ["Asia", "South America", "Europe", "Africa"],
    correctIndex: 1,
    explanation: "Brazil is the largest country in South America by both land area and population."
  },
  {
    id: 107,
    subject: "science",
    question: "What temperature does water freeze at in Celsius?",
    options: ["100°C", "32°C", "0°C", "-10°C"],
    correctIndex: 2,
    explanation: "Under standard atmospheric pressure, pure water freezes into ice at 0°C (32°F)."
  },
  {
    id: 108,
    subject: "literature",
    question: "Who wrote Romeo and Juliet?",
    options: ["William Shakespeare", "Charles Dickens", "Jane Austen", "Mark Twain"],
    correctIndex: 0,
    explanation: "William Shakespeare wrote the tragic play Romeo and Juliet in the late 16th century."
  },
  {
    id: 109,
    subject: "art",
    question: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Michelangelo", "Leonardo da Vinci"],
    correctIndex: 3,
    explanation: "Leonardo da Vinci created the masterpiece portrait 'Mona Lisa' in the early 1500s."
  },
  {
    id: 110,
    subject: "geography",
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Rome", "Paris"],
    correctIndex: 3,
    explanation: "Paris is the capital and most populous city of France."
  },
  {
    id: 111,
    subject: "history",
    question: "Which ancient civilization built the pyramids of Giza?",
    options: ["Ancient Greece", "Ancient Rome", "Egypt", "Mesopotamia"],
    correctIndex: 2,
    explanation: "The ancient Egyptians constructed the pyramids along the Nile River as monumental tombs."
  },
  {
    id: 112,
    subject: "science",
    question: "What is the largest organ of the human body?",
    options: ["Liver", "Brain", "Skin", "Lungs"],
    correctIndex: 2,
    explanation: "The skin is the largest organ of the human body, acting as a protective barrier."
  },
  {
    id: 113,
    subject: "general",
    question: "How many days are in a leap year?",
    options: ["365", "364", "366", "360"],
    correctIndex: 2,
    explanation: "A leap year has 366 days instead of 365, adding an extra day (February 29)."
  },
  {
    id: 114,
    subject: "science",
    question: "What is the transition of liquid into vapor called?",
    options: ["Condensation", "Freezing", "Vaporization", "Sublimation"],
    correctIndex: 2,
    explanation: "Vaporization (including boiling and evaporation) is the phase change from liquid to vapor."
  },
  {
    id: 115,
    subject: "science",
    question: "In which direction does the Sun set?",
    options: ["East", "North", "South", "West"],
    correctIndex: 3,
    explanation: "Due to Earth's eastward rotation, the Sun appears to rise in the east and set in the west."
  },
  {
    id: 116,
    subject: "math",
    question: "How many milliliters are in one liter?",
    options: ["100", "500", "1000", "10000"],
    correctIndex: 2,
    explanation: "The metric prefix 'milli-' signifies one thousandth, so 1 liter = 1000 milliliters."
  },
  {
    id: 117,
    subject: "science",
    question: "Which metal is the central component of hemoglobin in red blood cells?",
    options: ["Iron", "Copper", "Zinc", "Magnesium"],
    correctIndex: 0,
    explanation: "Iron binds oxygen molecules in hemoglobin, enabling blood to transport oxygen."
  },
  {
    id: 118,
    subject: "science",
    question: "Which marine mammal is celebrated for its intelligence, playfulness, and clicks?",
    options: ["Shark", "Whale Shark", "Dolphin", "Sea Turtle"],
    correctIndex: 2,
    explanation: "Dolphins are highly intelligent aquatic mammals known for echolocation and social pods."
  },
  {
    id: 119,
    subject: "geography",
    question: "What is the largest continent by both area and population?",
    options: ["Africa", "North America", "Europe", "Asia"],
    correctIndex: 3,
    explanation: "Asia is the largest continent, covering ~30% of Earth's land and over 60% of world population."
  },
  {
    id: 120,
    subject: "science",
    question: "What natural force pulls objects toward the center of the Earth?",
    options: ["Magnetism", "Gravity", "Friction", "Tension"],
    correctIndex: 1,
    explanation: "Gravity is the fundamental force of attraction between masses, giving weight to physical objects."
  },
  {
    id: 121,
    subject: "science",
    question: "Which muscular organ pumps blood throughout the circulatory system?",
    options: ["Lungs", "Heart", "Stomach", "Kidneys"],
    correctIndex: 1,
    explanation: "The heart beats continuously to pump oxygen-rich blood through arteries and veins."
  },
  {
    id: 122,
    subject: "geography",
    question: "Which continent is located at the southernmost part of the globe?",
    options: ["Australia", "Greenland", "Antarctica", "Arctic"],
    correctIndex: 2,
    explanation: "Antarctica surrounds the South Pole and is the coldest, windiest, and driest continent."
  },
  {
    id: 123,
    subject: "science",
    question: "Which flightless aquatic bird is native almost exclusively to the Southern Hemisphere?",
    options: ["Penguin", "Ostrich", "Kiwi", "Emu"],
    correctIndex: 0,
    explanation: "Penguins are highly adapted marine birds that spend half their lives on land and half in oceans."
  },
  {
    id: 124,
    subject: "math",
    question: "What angle is formed by perpendicular lines in degrees?",
    options: ["45°", "180°", "360°", "90°"],
    correctIndex: 3,
    explanation: "Perpendicular lines intersect at right angles, measuring exactly 90 degrees."
  },
  {
    id: 125,
    subject: "science",
    question: "What sweet, viscous substance do honeybees produce from flower nectar?",
    options: ["Wax", "Honey", "Maple", "Sap"],
    correctIndex: 1,
    explanation: "Bees collect nectar and transform it through enzymatic digestion and evaporation into honey."
  },
  {
    id: 126,
    subject: "math",
    question: "How many sides does a regular hexagon have?",
    options: ["5", "8", "6", "7"],
    correctIndex: 2,
    explanation: "A hexagon is a polygon with exactly six vertices and six sides."
  }
];

/* ------------------------------------------------------------------ */
/*  3. Web Audio API Sound Effects                                    */
/* ------------------------------------------------------------------ */
class BingoSoundController {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  playTumblerRoll() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 7; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(140 + Math.random() * 220, now + i * 0.08);
      gain.gain.setValueAtTime(0.08, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.07);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.08);
    }
  }

  playBallDrop() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  playCorrectAnswer() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.18, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.07 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.38);
    });
  }

  playDabberStamp() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Punchy mechanical thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.14);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playWrongBuzz() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(130, now + 0.28);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  playBingoWin() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    melody.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.13);
      gain.gain.setValueAtTime(0.25, now + idx * 0.13);
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.13 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.13);
      osc.stop(now + idx * 0.13 + 0.42);
    });
  }
}

const audioCtrl = new BingoSoundController();

/* ------------------------------------------------------------------ */
/*  4. Types & Grid Helpers                                           */
/* ------------------------------------------------------------------ */
type BingoMode = "line" | "full";

interface BingoSquare {
  id: number;
  text: string;
  isFree: boolean;
  isStamped: boolean;
  row: number;
  col: number;
}

interface HallRegular {
  id: string;
  name: string;
  avatar: string;
  stampsCount: number;
}

export default function BingoNightGame() {
  const [deck] = useState<DeckInfo>(() => {
    const active = getActiveDeck();
    if (active && active.questions && active.questions.length >= 10) return active;
    return {
      id: "sample_bingo",
      title: "General Knowledge Bingo",
      sourceType: "sample",
      questionCount: BINGO_SAMPLE_QUESTIONS.length,
      createdAt: Date.now(),
      questions: BINGO_SAMPLE_QUESTIONS
    };
  });

  // Host Caller Selection
  const [callerIndex, setCallerIndex] = useState(0);
  const currentCaller = BINGO_CHARACTERS[callerIndex];

  // Game Phases
  const [gameState, setGameState] = useState<"lobby" | "pick_mode" | "playing" | "victory">("lobby");
  const [mode, setMode] = useState<BingoMode>("full");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Pool of Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [ballsCalled, setBallsCalled] = useState(0);
  const [stars, setStars] = useState(0);

  // 5x5 Bingo Grid
  const [cardSquares, setCardSquares] = useState<BingoSquare[]>([]);
  const [highlightedSquareId, setHighlightedSquareId] = useState<number | null>(null);

  // Tumbler animation
  const [isSpinning, setIsSpinning] = useState(false);
  const [drawnBallNumber, setDrawnBallNumber] = useState<number | null>(null);

  // Question Interaction State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [autoNext, setAutoNext] = useState(true);

  // Dialogue & Feedback
  const [hostDialogue, setHostDialogue] = useState("Let's see what we've got.");
  const [promptBanner, setPromptBanner] = useState("Take your time — the ball waits for you.");
  const [floatingStars, setFloatingStars] = useState<{ id: number; text: string }[]>([]);

  // Explain Modal
  const [explainOpen, setExplainOpen] = useState(false);

  // Hall Regulars AI Rivals
  const [hallRegulars, setHallRegulars] = useState<HallRegular[]>([]);

  // Audio Sync
  useEffect(() => {
    audioCtrl.enabled = soundEnabled;
  }, [soundEnabled]);

  // Generate Hall Regulars from characters other than the caller
  useEffect(() => {
    const rivals = BINGO_CHARACTERS.filter((_, idx) => idx !== callerIndex).slice(0, 3);
    setHallRegulars(
      rivals.map(r => ({
        id: r.id,
        name: r.name,
        avatar: r.imageSrc,
        stampsCount: 1 // Start with center free star
      }))
    );
  }, [callerIndex]);

  /* ------------------------------------------------------------------ */
  /*  Initialize Bingo Card and Questions                               */
  /* ------------------------------------------------------------------ */
  const initializeGame = useCallback((chosenMode: BingoMode) => {
    setMode(chosenMode);

    // Merge deck questions with reference sample questions to ensure abundant bingo coverage
    const pool = [...BINGO_SAMPLE_QUESTIONS, ...deck.questions];
    // De-duplicate questions by question text
    const uniquePool = pool.filter((q, idx, arr) => arr.findIndex(item => item.question === q.question) === idx);
    const shuffledPool = [...uniquePool].sort(() => 0.5 - Math.random());
    setQuestions(shuffledPool);

    // Pick 24 distinct correct answers for the 5x5 grid (24 words + 1 center star)
    const answersSet = new Set<string>();
    for (const q of shuffledPool) {
      const correctAns = q.options[q.correctIndex]?.trim();
      if (correctAns && answersSet.size < 24) {
        answersSet.add(correctAns);
      }
    }
    const cardWords = Array.from(answersSet);
    // Fill remaining if needed
    while (cardWords.length < 24) {
      cardWords.push(`Term ${cardWords.length + 1}`);
    }

    // Build 5x5 grid
    const squares: BingoSquare[] = [];
    let wordIdx = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isFree = r === 2 && c === 2;
        squares.push({
          id: r * 5 + c,
          row: r,
          col: c,
          isFree,
          isStamped: isFree, // Center free space is pre-stamped
          text: isFree ? "⭐" : cardWords[wordIdx++]
        });
      }
    }

    setCardSquares(squares);
    setCurrentQIndex(0);
    setBallsCalled(1);
    setStars(0);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setIsCorrect(false);
    setHighlightedSquareId(null);
    setGameState("playing");
    setDrawnBallNumber(Math.floor(Math.random() * 75) + 1);

    // Reset rivals
    const rivals = BINGO_CHARACTERS.filter((_, idx) => idx !== callerIndex).slice(0, 3);
    setHallRegulars(
      rivals.map(r => ({
        id: r.id,
        name: r.name,
        avatar: r.imageSrc,
        stampsCount: 1
      }))
    );

    // Initial Host line
    const caller = BINGO_CHARACTERS[callerIndex];
    setHostDialogue("Let's see what we've got.");
    setPromptBanner("Take your time — the ball waits for you.");

    // Sound
    audioCtrl.playTumblerRoll();
  }, [deck, callerIndex]);

  /* ------------------------------------------------------------------ */
  /*  Draw Next Ball                                                    */
  /* ------------------------------------------------------------------ */
  const rollNextBall = useCallback(() => {
    if (gameState !== "playing") return;

    setIsSpinning(true);
    setHighlightedSquareId(null);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setIsCorrect(false);

    audioCtrl.playTumblerRoll();

    const tumblerQuotes = [
      "Round and round she goes...",
      "Shake it up, shake it up!",
      "Let's see what we've got in the tumbler!",
      "Spinning the golden cage..."
    ];
    setHostDialogue(tumblerQuotes[Math.floor(Math.random() * tumblerQuotes.length)]);
    setPromptBanner("Answer right to stamp that square on your card.");

    setTimeout(() => {
      setIsSpinning(false);
      setDrawnBallNumber(Math.floor(Math.random() * 75) + 1);
      audioCtrl.playBallDrop();

      setCurrentQIndex(prev => (prev + 1) % (questions.length || 1));
      setBallsCalled(prev => prev + 1);

      // Hall Regulars occasionally stamp a square (1 in 3 chance)
      setHallRegulars(prev =>
        prev.map(reg => {
          if (Math.random() < 0.35 && reg.stampsCount < 24) {
            return { ...reg, stampsCount: reg.stampsCount + 1 };
          }
          return reg;
        })
      );
    }, 700);
  }, [gameState, questions.length]);

  const currentQ: Question | undefined = questions[currentQIndex] || BINGO_SAMPLE_QUESTIONS[0];

  /* ------------------------------------------------------------------ */
  /*  Handle Answer Selection                                           */
  /* ------------------------------------------------------------------ */
  const handleSelectAnswer = (optionIdx: number) => {
    if (isAnswerRevealed || !currentQ) return;

    setSelectedOption(optionIdx);
    setIsAnswerRevealed(true);

    const isAnsCorrect = optionIdx === currentQ.correctIndex;
    setIsCorrect(isAnsCorrect);

    const caller = BINGO_CHARACTERS[callerIndex];
    const correctText = currentQ.options[currentQ.correctIndex];

    if (isAnsCorrect) {
      audioCtrl.playCorrectAnswer();
      setHostDialogue(`The answer was: ${correctText}!`);

      // Check if this correct answer exists on player's bingo card
      const matchingSquare = cardSquares.find(
        sq => !sq.isStamped && sq.text.trim().toLowerCase() === correctText.trim().toLowerCase()
      );

      if (matchingSquare) {
        setHighlightedSquareId(matchingSquare.id);
        setPromptBanner("That's on your card — stamp it!");
      } else {
        setPromptBanner("Good answer! That ball isn't on your card, next ball!");
      }
    } else {
      audioCtrl.playWrongBuzz();
      setHostDialogue(`The answer was: ${correctText}!`);
      setPromptBanner("The ball rolls back into the cage.");

      // If autoNext is on, advance after 2.2 seconds on wrong answer
      if (autoNext) {
        setTimeout(() => {
          rollNextBall();
        }, 2200);
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Stamp Bingo Square                                                */
  /* ------------------------------------------------------------------ */
  const handleStampSquare = (square: BingoSquare) => {
    // Square can be stamped if it's the currently highlighted square or already matched
    if (square.isStamped) return;

    if (highlightedSquareId === square.id || (isCorrect && currentQ && square.text.trim().toLowerCase() === currentQ.options[currentQ.correctIndex].trim().toLowerCase())) {
      audioCtrl.playDabberStamp();

      // Update card
      const updated = cardSquares.map(sq => (sq.id === square.id ? { ...sq, isStamped: true } : sq));
      setCardSquares(updated);
      setHighlightedSquareId(null);
      setStars(prev => prev + 1);

      // Floating Star Reward animation
      const newReward = { id: Date.now(), text: "+1 ⭐" };
      setFloatingStars(prev => [...prev, newReward]);
      setTimeout(() => {
        setFloatingStars(prev => prev.filter(r => r.id !== newReward.id));
      }, 1200);

      // Check Win condition
      const isWin = checkWin(updated, mode);
      if (isWin) {
        handleBingoWin();
        return;
      }

      // If autoNext is true, roll next ball after a brief moment
      if (autoNext) {
        setTimeout(() => {
          rollNextBall();
        }, 1100);
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Check Win Condition                                               */
  /* ------------------------------------------------------------------ */
  const checkWin = (squares: BingoSquare[], gameMode: BingoMode): boolean => {
    if (gameMode === "full") {
      return squares.every(sq => sq.isStamped);
    }

    // Line Bingo: Check rows
    for (let r = 0; r < 5; r++) {
      if (squares.filter(sq => sq.row === r).every(sq => sq.isStamped)) return true;
    }
    // Check cols
    for (let c = 0; c < 5; c++) {
      if (squares.filter(sq => sq.col === c).every(sq => sq.isStamped)) return true;
    }
    // Diagonals
    const diag1 = [0, 6, 12, 18, 24];
    if (diag1.every(id => squares[id]?.isStamped)) return true;
    const diag2 = [4, 8, 12, 16, 20];
    if (diag2.every(id => squares[id]?.isStamped)) return true;

    return false;
  };

  const handleBingoWin = () => {
    audioCtrl.playBingoWin();
    const caller = BINGO_CHARACTERS[callerIndex];
    setHostDialogue(caller.bingoQuote);
    setGameState("victory");

    // Award XP and maintain Daily Streak
    addXp(150, "Bingo Night Victory");
    recordActivityToday("Completed Bingo Night", 25);
  };

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <div className="sq-bingo-app">
      {/* Top Standard Navigation */}
      <TopNav />

      {/* Main Bingo Game Container */}
      <div className="sq-bingo-container">
        {/* ========================================================== */}
        {/* VIEW 1: LOBBY SCREEN (Matches Ref Video 00:04s)             */}
        {/* ========================================================== */}
        {gameState === "lobby" && (
          <div className="sq-bingo-lobby-scene">
            {/* Hanging Festoon String Lights */}
            <div className="sq-bingo-string-lights">
              <span className="sq-bulb bulb-1" />
              <span className="sq-bulb bulb-2" />
              <span className="sq-bulb bulb-3" />
              <span className="sq-bulb bulb-4" />
              <span className="sq-bulb bulb-5" />
              <span className="sq-bulb bulb-6" />
              <span className="sq-bulb bulb-7" />
              <span className="sq-bulb bulb-8" />
            </div>

            {/* Cozy Arched Night Windows with Stars and Moon */}
            <div className="sq-bingo-windows-backdrop">
              <div className="sq-arch-window window-left">
                <div className="sq-window-pane" />
              </div>
              <div className="sq-arch-window window-right">
                <div className="sq-window-moon" />
                <div className="sq-window-pane" />
              </div>
            </div>

            {/* Vintage Radio Console with Host Character */}
            <div className="sq-bingo-host-console">
              <div className="sq-host-character-frame">
                <img
                  src={currentCaller.imageSrc}
                  alt={currentCaller.name}
                  className="sq-host-portrait-lobby"
                />
              </div>
              {/* Brass Cage Ball Tumbler on Console */}
              <div className="sq-brass-tumbler-mini">
                <div className="sq-tumbler-cage">
                  <div className="sq-tumbler-ball ball-red" />
                  <div className="sq-tumbler-ball ball-gold" />
                  <div className="sq-tumbler-ball ball-cream" />
                </div>
                <div className="sq-tumbler-crank" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <h1 className="sq-bingo-main-title">B I N G O &nbsp; N I G H T</h1>
            <p className="sq-bingo-subtitle">
              Answer questions to stamp your card. Five in a row — BINGO!
            </p>

            {/* Character Host Selector Pill */}
            <div className="sq-caller-selector-bar">
              <span className="sq-caller-label">Tonight's Caller:</span>
              <div className="sq-caller-pills">
                {BINGO_CHARACTERS.map((char, idx) => (
                  <button
                    key={char.id}
                    className={`sq-caller-chip ${callerIndex === idx ? "active" : ""}`}
                    onClick={() => setCallerIndex(idx)}
                    title={char.title}
                  >
                    <img src={char.imageSrc} alt={char.name} className="sq-caller-chip-img" />
                    <span>{char.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lobby Cards (Play Solo & Host a Night) */}
            <div className="sq-bingo-cards-row">
              {/* Card 1: Play Solo */}
              <div
                className="sq-bingo-option-card play-solo-card"
                onClick={() => setGameState("pick_mode")}
                role="button"
                tabIndex={0}
              >
                <div className="sq-card-icon-circle user-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <h2 className="sq-card-title">Play solo</h2>
                <p className="sq-card-desc">
                  You against the three Hall Regulars.
                </p>
              </div>

              {/* Card 2: Host a Night */}
              <div className="sq-bingo-option-card host-night-card disabled">
                <div className="sq-card-icon-circle tv-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z" />
                  </svg>
                  <span className="sq-disabled-slash" />
                </div>
                <h2 className="sq-card-title">Host a night</h2>
                <p className="sq-card-desc">
                  Your class joins with a code at studyquest.app/join.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 2: PICK YOUR NIGHT (Matches Ref Video 00:06s)          */}
        {/* ========================================================== */}
        {gameState === "pick_mode" && (
          <div className="sq-bingo-lobby-scene">
            <h1 className="sq-bingo-main-title">B I N G O &nbsp; N I G H T</h1>
            <p className="sq-bingo-subtitle">
              Answer questions to stamp your card. Five in a row — BINGO!
            </p>

            <div className="sq-bingo-cards-row">
              {/* Pick Your Night Modal Card */}
              <div className="sq-bingo-option-card pick-night-card">
                <div className="sq-pick-night-header">
                  <button
                    className="sq-back-arrow-btn"
                    onClick={() => setGameState("lobby")}
                    title="Back"
                  >
                    ←
                  </button>
                  <span className="sq-pick-night-title">PICK YOUR NIGHT</span>
                </div>

                <div className="sq-night-modes-list">
                  {/* Option 1: Line Bingo */}
                  <button
                    className="sq-mode-choice-btn"
                    onClick={() => initializeGame("line")}
                  >
                    <div className="sq-mode-icon lines-icon">
                      <span>≡</span>
                    </div>
                    <div className="sq-mode-info">
                      <strong>Line Bingo</strong>
                      <small>First full line wins. Quick rounds.</small>
                    </div>
                  </button>

                  {/* Option 2: Full Card */}
                  <button
                    className="sq-mode-choice-btn active-gold"
                    onClick={() => initializeGame("full")}
                  >
                    <div className="sq-mode-icon star-icon">
                      <span>★</span>
                    </div>
                    <div className="sq-mode-info">
                      <strong>Full card</strong>
                      <small>Stamp every square — BINGO!</small>
                    </div>
                  </button>
                </div>
              </div>

              {/* Card 2: Host a Night (Static side card) */}
              <div className="sq-bingo-option-card host-night-card disabled">
                <div className="sq-card-icon-circle tv-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z" />
                  </svg>
                  <span className="sq-disabled-slash" />
                </div>
                <h2 className="sq-card-title">Host a night</h2>
                <p className="sq-card-desc">
                  Your class joins with a code at studyquest.app/join.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 3: ACTIVE GAMEPLAY SCREEN (Matches Ref Video 00:08s-56s)*/}
        {/* ========================================================== */}
        {gameState === "playing" && (
          <div className="sq-bingo-playfield">
            {/* Top Game Bar */}
            <div className="sq-bingo-topbar">
              <div className="sq-topbar-left">
                <button
                  className="sq-leave-hall-btn"
                  onClick={() => setGameState("lobby")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Leave the hall</span>
                </button>

                <button
                  className="sq-sound-toggle-btn"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? "Mute sound" : "Unmute sound"}
                >
                  {soundEnabled ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Hall Regulars Standings */}
              <div className="sq-topbar-rivals">
                <span className="sq-rivals-heading">Hall Regulars:</span>
                {hallRegulars.map(reg => (
                  <div key={reg.id} className="sq-rival-pill" title={`${reg.name}: ${reg.stampsCount}/24 stamps`}>
                    <img src={reg.avatar} alt={reg.name} className="sq-rival-avatar" />
                    <span>{reg.name.split(" ")[0]}</span>
                    <strong className="sq-rival-stamps">{reg.stampsCount}</strong>
                  </div>
                ))}
              </div>

              {/* Stats Pills (Mode, Balls Called, Stars) */}
              <div className="sq-topbar-right">
                <span className="sq-stat-pill mode-pill">
                  {mode === "full" ? "Full card" : "Line bingo"}
                </span>
                <span className="sq-stat-pill balls-pill">
                  Balls called: {ballsCalled}
                </span>
                <span className="sq-stat-pill stars-pill">
                  ⭐ {stars}
                </span>
              </div>
            </div>

            {/* Amber Prompt Banner */}
            <div className="sq-amber-prompt-banner">
              {promptBanner}
            </div>

            {/* Main Split Grid */}
            <div className="sq-bingo-stage-grid">
              {/* ---------------------------------------------------- */}
              {/* LEFT COLUMN: Tumbler, Caller & Question Card         */}
              {/* ---------------------------------------------------- */}
              <div className="sq-bingo-caller-column">
                {/* Caller & Tumbler Stage */}
                <div className="sq-tumbler-host-row">
                  {/* Brass Ball Cage Tumbler */}
                  <div className={`sq-brass-tumbler ${isSpinning ? "spinning" : ""}`}>
                    <div className="sq-tumbler-cage-body">
                      {drawnBallNumber && !isSpinning && (
                        <div className="sq-drawn-ball-badge">
                          #{drawnBallNumber}
                        </div>
                      )}
                      <div className="sq-tumbler-cage-mesh" />
                    </div>
                    <div className="sq-tumbler-stand" />
                    <div className="sq-tumbler-crank-arm" />
                  </div>

                  {/* Anime Host Character Portrait */}
                  <div className="sq-caller-portrait-wrap">
                    <img
                      src={currentCaller.imageSrc}
                      alt={currentCaller.name}
                      className="sq-caller-portrait-img"
                    />
                    <div className="sq-caller-nametag-pill">
                      {currentCaller.name}
                    </div>
                  </div>

                  {/* Speech Bubble */}
                  <div className={`sq-bingo-speech-bubble ${isAnswerRevealed ? (isCorrect ? "happy" : "wrong") : ""}`}>
                    <div className="sq-speech-tail" />
                    <p className="sq-speech-text">{hostDialogue}</p>
                  </div>
                </div>

                {/* Question Card Box */}
                <div className="sq-bingo-question-card">
                  {currentQ && (
                    <>
                      <h3 className="sq-question-title">{currentQ.question}</h3>

                      {/* Before Answer is Revealed: 4-Choice Grid */}
                      {!isAnswerRevealed ? (
                        <div className="sq-choices-2x2-grid">
                          {currentQ.options.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              className="sq-choice-btn"
                              onClick={() => handleSelectAnswer(oIdx)}
                            >
                              <span className="sq-choice-num">{oIdx + 1}</span>
                              <span className="sq-choice-label">{opt}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        /* After Answer is Revealed */
                        <div className="sq-revealed-section">
                          {isCorrect ? (
                            /* Correct Answer Feedback */
                            <div className="sq-correct-state-box">
                              {highlightedSquareId !== null ? (
                                <div className="sq-stamp-instruction-text">
                                  It's on your card — <strong>STAMP!</strong>
                                </div>
                              ) : (
                                <div className="sq-stamp-instruction-text neutral">
                                  Good answer! Next ball awaits:
                                </div>
                              )}

                              <button
                                className="sq-next-ball-action-btn"
                                onClick={rollNextBall}
                              >
                                Next ball →
                              </button>
                            </div>
                          ) : (
                            /* Wrong Answer Feedback (Matches Ref Video 00:12s) */
                            <div className="sq-wrong-state-box">
                              <div className="sq-choices-2x2-grid static-result">
                                {currentQ.options.map((opt, oIdx) => {
                                  const isUserSelected = oIdx === selectedOption;
                                  const isTheCorrect = oIdx === currentQ.correctIndex;
                                  return (
                                    <div
                                      key={oIdx}
                                      className={`sq-choice-btn static ${isTheCorrect ? "revealed-correct" : isUserSelected ? "revealed-wrong" : ""}`}
                                    >
                                      <span className="sq-choice-num">{oIdx + 1}</span>
                                      <span className="sq-choice-label">{opt}</span>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="sq-wrong-feedback-banner">
                                <span className="sq-wrong-banner-title">
                                  The answer was: {currentQ.options[currentQ.correctIndex]}
                                </span>
                                <span className="sq-wrong-banner-sub">
                                  Not this time — the ball rolls back in.
                                </span>
                              </div>

                              <div className="sq-wrong-actions-row">
                                <button
                                  className="sq-explain-btn"
                                  onClick={() => setExplainOpen(true)}
                                >
                                  ✨ Explain why this is wrong
                                </button>
                                <button
                                  className="sq-next-ball-action-btn"
                                  onClick={rollNextBall}
                                >
                                  Next ball →
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Auto Next Checkbox */}
                          <label className="sq-autonext-checkbox-label">
                            <input
                              type="checkbox"
                              checked={autoNext}
                              onChange={e => setAutoNext(e.target.checked)}
                            />
                            <span>Auto-next after correct answers</span>
                          </label>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* RIGHT COLUMN: 5x5 Bingo Card                         */}
              {/* ---------------------------------------------------- */}
              <div className="sq-bingo-card-column">
                <div className="sq-card-column-header">
                  {mode === "full" ? "Stamp every square — BINGO!" : "First full line wins — BINGO!"}
                </div>

                <div className="sq-bingo-board-container">
                  <div className="sq-bingo-5x5-grid">
                    {cardSquares.map(sq => {
                      const isHighlighted = highlightedSquareId === sq.id;
                      return (
                        <button
                          key={sq.id}
                          className={`sq-bingo-cell ${sq.isFree ? "free-star" : ""} ${sq.isStamped ? "stamped" : ""} ${isHighlighted ? "highlighted-pulse" : ""}`}
                          onClick={() => handleStampSquare(sq)}
                          disabled={sq.isStamped && !sq.isFree}
                          title={sq.isFree ? "Free Star" : sq.text}
                        >
                          <span className="sq-cell-text">{sq.text}</span>

                          {/* Realistic Dabber Ink Splatter Stamp */}
                          {sq.isStamped && !sq.isFree && (
                            <div className="sq-ink-stamp-splatter">
                              <svg viewBox="0 0 100 100" className="sq-stamp-svg">
                                <circle cx="50" cy="50" r="38" className="sq-stamp-circle" />
                                <circle cx="28" cy="24" r="5" className="sq-stamp-drop" />
                                <circle cx="72" cy="74" r="4.5" className="sq-stamp-drop" />
                                <circle cx="78" cy="28" r="4" className="sq-stamp-drop" />
                                <circle cx="20" cy="68" r="3.5" className="sq-stamp-drop" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Star Badges on correct stamp */}
            {floatingStars.map(item => (
              <div key={item.id} className="sq-bingo-floating-reward">
                {item.text}
              </div>
            ))}
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 4: VICTORY / BINGO POPUP                              */}
        {/* ========================================================== */}
        {gameState === "victory" && (
          <div className="sq-bingo-victory-overlay">
            <div className="sq-bingo-victory-modal">
              <div className="sq-victory-confetti" />
              <div className="sq-victory-trophy">🏆</div>
              <h2 className="sq-victory-headline">B I N G O !</h2>
              <p className="sq-victory-sub">
                {currentCaller.bingoQuote}
              </p>

              <div className="sq-victory-stats-grid">
                <div className="sq-vstat-box">
                  <span className="sq-vstat-val">{ballsCalled}</span>
                  <span className="sq-vstat-lbl">Balls Called</span>
                </div>
                <div className="sq-vstat-box">
                  <span className="sq-vstat-val">⭐ {stars}</span>
                  <span className="sq-vstat-lbl">Stars Earned</span>
                </div>
                <div className="sq-vstat-box">
                  <span className="sq-vstat-val">+150</span>
                  <span className="sq-vstat-lbl">XP Gained</span>
                </div>
              </div>

              <div className="sq-victory-actions">
                <button
                  className="sq-victory-primary-btn"
                  onClick={() => initializeGame(mode)}
                >
                  Play Another Round
                </button>
                <button
                  className="sq-victory-secondary-btn"
                  onClick={() => setGameState("lobby")}
                >
                  Back to Hall Lobby
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* EXPLAIN MODAL                                              */}
        {/* ========================================================== */}
        {explainOpen && currentQ && (
          <div className="sq-bingo-modal-overlay" onClick={() => setExplainOpen(false)}>
            <div className="sq-bingo-explain-card" onClick={e => e.stopPropagation()}>
              <div className="sq-explain-modal-header">
                <h3>Concept Explanation</h3>
                <button className="sq-modal-close-btn" onClick={() => setExplainOpen(false)}>
                  ✕
                </button>
              </div>

              <div className="sq-explain-content">
                <p className="sq-explain-q">
                  <strong>Question:</strong> {currentQ.question}
                </p>
                <div className="sq-explain-answer-pill">
                  <strong>Correct Answer:</strong> {currentQ.options[currentQ.correctIndex]}
                </div>
                <div className="sq-explain-body">
                  {currentQ.explanation ||
                    "This concept is derived from your study material. Review the key terms and memorize the association to ace your next round!"}
                </div>
              </div>

              <div className="sq-explain-footer">
                <button
                  className="sq-explain-gotit-btn"
                  onClick={() => setExplainOpen(false)}
                >
                  Got it, let's keep playing!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
