export interface Game {
  slug: string;
  name: string;
  description?: string;
  image: string;
  category: string;
  multiplayer?: boolean;
  rating?: number;
  ratingCount?: number;
  isNew?: boolean;
  isLocked?: boolean;
}

export interface Category {
  slug: string;
  label: string;
  color: string;
  description?: string;
}

export interface FilterTab {
  id: string;
  label: string;
  color?: string;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export const CATEGORIES: Category[] = [
  { slug: "classroom", label: "Classroom", color: "rgb(59, 130, 246)" },
  { slug: "trivia", label: "Quiz Shows & Trivia", color: "rgb(123, 79, 224)" },
  { slug: "arcade", label: "Action & Arcade", color: "rgb(242, 84, 45)" },
  { slug: "puzzle", label: "Puzzle & Strategy", color: "rgb(20, 184, 166)" },
  { slug: "sports", label: "Sports", color: "rgb(34, 197, 94)" },
  { slug: "adventure", label: "RPG & Adventure", color: "rgb(192, 54, 75)" },
  { slug: "chill", label: "Chill & Study", color: "rgb(56, 189, 248)" },
  { slug: "worlds", label: "Immersive Worlds", color: "rgb(142, 134, 240)" },
];

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------
export const FILTER_TABS: FilterTab[] = [
  { id: "all", label: "All" },
  { id: "friends", label: "With friends", color: "#3B82F6" },
  { id: "quick", label: "Quick round", color: "#FFA826" },
  { id: "deep", label: "Deep focus", color: "#7B4FE0" },
  { id: "classroom", label: "Classroom", color: "rgb(59, 130, 246)" },
  { id: "trivia", label: "Trivia", color: "rgb(123, 79, 224)" },
  { id: "arcade", label: "Arcade", color: "rgb(242, 84, 45)" },
  { id: "puzzle", label: "Puzzle", color: "rgb(20, 184, 166)" },
  { id: "sports", label: "Sports", color: "rgb(34, 197, 94)" },
  { id: "adventure", label: "Adventure", color: "rgb(192, 54, 75)" },
  { id: "chill", label: "Chill", color: "rgb(56, 189, 248)" },
  { id: "worlds", label: "Worlds", color: "rgb(142, 134, 240)" },
];

// ---------------------------------------------------------------------------
// Popular slugs (top 6 in order)
// ---------------------------------------------------------------------------
export const POPULAR_SLUGS: string[] = [
  "study-cafe",
  "knowledge-factory",
  "night-library",
  "study-siege",
  "vault-heist",
  "classroom",
];

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------
export const GAMES: Game[] = [
  // ── Classroom ──────────────────────────────────────────────────────────
  {
    slug: "study-cafe",
    name: "Study Café",
    description:
      "Run a café where each order is a question from your study notes. Serve the matching menu item to earn stars and money, then pay the rent and decide what to buy for the café.",
    image: "/games/study-cafe.webp",
    category: "classroom",
    multiplayer: true,
    rating: 4.6,
    ratingCount: 932,
  },
  {
    slug: "classroom",
    name: "Classroom",
    description: "Classic classroom quiz experience with real-time competition.",
    image: "/games/study-cafe.webp",
    category: "classroom",
    multiplayer: true,
    rating: 4.5,
    ratingCount: 612,
  },
  {
    slug: "imposter-academy",
    name: "Imposter Academy",
    description: "Find the imposter by answering questions",
    image: "/assets/imposter-academy-f7a98264.svg",
    category: "classroom",
  },
  {
    slug: "bingo-night",
    name: "Bingo Night",
    description: "Play bingo with study questions",
    image: "/assets/bingo-night-6e8da9df.svg",
    category: "classroom",
  },
  {
    slug: "splat-squad",
    name: "Splat Squad",
    description: "Splat your opponents by answering correctly",
    image: "/games/splat-squad.svg",
    category: "classroom",
    multiplayer: true,
  },
  {
    slug: "tug-of-war",
    name: "Tug of War",
    description: "Answer questions to pull the rope",
    image: "/games/tug-of-war.svg",
    category: "classroom",
    multiplayer: true,
  },
  {
    slug: "boss-raid",
    name: "Boss Raid",
    description: "Team up to defeat the boss",
    image: "/assets/boss-raid-320-2117ffad.webp",
    category: "classroom",
    multiplayer: true,
  },

  // ── Quiz Shows & Trivia ────────────────────────────────────────────────
  {
    slug: "who-wants-to-be-a-millionaire",
    name: "Who Wants to Be a Millionaire",
    description: "Classic quiz show experience",
    image: "/assets/millionaire-320-856ed44c.webp",
    category: "trivia",
  },
  {
    slug: "hangman",
    name: "Hangman",
    description: "Guess the word before it's too late",
    image: "/games/flash.svg",
    category: "trivia",
  },
  {
    slug: "study-jeopardy",
    name: "Study Jeopardy!",
    description: "Classic Jeopardy! format with your study material",
    image: "/assets/jeopardy-320-58605c58.webp",
    category: "trivia",
    multiplayer: true,
  },
  {
    slug: "quiz-rocket",
    name: "Quiz Rocket",
    description: "Launch your rocket by answering correctly",
    image: "/assets/quiz-rocket-320-feaea1b2.webp",
    category: "trivia",
  },
  {
    slug: "knowledge-royale",
    name: "Knowledge Royale",
    description: "Battle royale with knowledge",
    image: "/assets/knowledge-royale-320-70541230.webp",
    category: "trivia",
    multiplayer: true,
  },
  {
    slug: "dice-dash",
    name: "Dice Dash",
    description: "Roll dice and answer questions to advance",
    image: "/games/dice-dash.svg",
    category: "trivia",
    multiplayer: true,
  },

  // ── Action & Arcade ────────────────────────────────────────────────────
  {
    slug: "super-pip",
    name: "Super Pip",
    description: "Platform adventure with quiz challenges",
    image: "/games/super-pip.svg",
    category: "arcade",
  },
  {
    slug: "angry-nerds",
    name: "Angry Nerds",
    description: "Launch nerds at targets by answering correctly",
    image: "/games/angry-nerds.svg",
    category: "arcade",
  },
  {
    slug: "glitch-hunter",
    name: "Glitch Hunter",
    description: "Hunt down glitches in the matrix",
    image: "/assets/glitch-hunter-863f341c.svg",
    category: "arcade",
  },
  {
    slug: "quiz-wings",
    name: "Quiz Wings",
    description: "Fly through obstacles by answering",
    image: "/assets/quiz-wings-320-237b32bf.webp",
    category: "arcade",
  },
  {
    slug: "pizza-rush",
    name: "Pizza Rush",
    description: "Deliver pizzas by answering questions",
    image: "/games/pizza-rush.webp",
    category: "arcade",
  },
  {
    slug: "glow-up",
    name: "Glow Up",
    description: "Level up your character with knowledge",
    image: "/games/glow-up.webp",
    category: "arcade",
  },
  {
    slug: "pocket-bounce",
    name: "Pocket Bounce",
    description: "Bounce your way to victory",
    image: "/games/pocket-bounce.svg",
    category: "arcade",
  },
  {
    slug: "meteor-storm",
    name: "Meteor Storm",
    description: "Destroy meteors with correct answers",
    image: "/assets/meteor-storm-320-04d1abdd.webp",
    category: "arcade",
  },
  {
    slug: "deep-dive",
    name: "Deep Dive",
    description: "Dive deep and discover treasures",
    image: "/assets/deep-dive-21383f68.svg",
    category: "arcade",
  },
  {
    slug: "stack",
    name: "Stack",
    description: "Stack blocks by answering correctly",
    image: "/assets/stack-smith-056129d6.svg",
    category: "arcade",
  },
  {
    slug: "shadow-maze",
    name: "Shadow Maze",
    description: "Navigate the maze in darkness",
    image: "/assets/shadow-maze-73028430.svg",
    category: "arcade",
  },
  {
    slug: "phantom-flash",
    name: "Phantom Flash",
    description: "Quick reflexes and quick answers",
    image: "/assets/phantom-flash-846b9441.svg",
    category: "arcade",
  },
  {
    slug: "pac-man",
    name: "Pac Man",
    description: "Classic maze game with a study twist",
    image: "/assets/maze-muncher-72079d08.svg",
    category: "arcade",
  },
  {
    slug: "neon-rush",
    name: "Neon Rush",
    description: "Race through neon tracks",
    image: "/assets/neon-rush-61b8552d.svg",
    category: "arcade",
  },
  {
    slug: "subway-surfers",
    name: "Subway Surfers",
    description: "Surf and study",
    image: "/assets/study-blocks-320-177dd18d.webp",
    category: "arcade",
  },
  {
    slug: "mountain-climb",
    name: "Mountain Climb",
    description: "Climb the mountain with knowledge",
    image: "/assets/mountain-climb-320-4aa88c6b.webp",
    category: "arcade",
  },
  {
    slug: "study-bird",
    name: "Study Bird",
    description: "Flap through pipes by answering",
    image: "/assets/flappy-bird-320-a2433c09.webp",
    category: "arcade",
  },
  {
    slug: "snake",
    name: "Snake",
    description: "Classic snake with a study twist",
    image: "/assets/snake-320-e50dfd88.webp",
    category: "arcade",
  },
  {
    slug: "quiz-ninja",
    name: "Quiz Ninja",
    description: "Slice through questions like a ninja",
    image: "/assets/quiz-ninja-25c93fef.svg",
    category: "arcade",
  },
  {
    slug: "mole-mash",
    name: "Mole Mash",
    description: "Whack the moles with correct answers",
    image: "/assets/mole-mash-e4a7fb4e.svg",
    category: "arcade",
  },

  // ── Puzzle & Strategy ──────────────────────────────────────────────────
  {
    slug: "knowledge-factory",
    name: "Knowledge Factory",
    description:
      "Run a knowledge factory. Answer questions to manufacture products and manage your production line.",
    image: "/games/night-library.webp",
    category: "puzzle",
    multiplayer: true,
    rating: 4.7,
    ratingCount: 814,
  },
  {
    slug: "study-siege",
    name: "Study Siege",
    description:
      "Build towers by answering questions correctly. Defend against enemies in this strategy game.",
    image: "/games/study-siege.svg",
    category: "puzzle",
    multiplayer: true,
    rating: 4.4,
    ratingCount: 571,
  },
  {
    slug: "case-closed",
    name: "Case Closed",
    description: "Solve the mystery with your knowledge",
    image: "/games/case-closed.webp",
    category: "puzzle",
  },
  {
    slug: "battleships",
    name: "Battleships",
    description: "Sink ships by answering correctly",
    image: "/assets/sea-battle-241ed50c.svg",
    category: "puzzle",
    multiplayer: true,
  },
  {
    slug: "melon-merge",
    name: "Melon Merge",
    description: "Merge melons with correct answers",
    image: "/assets/melon-merge-a8182dfd.svg",
    category: "puzzle",
  },
  {
    slug: "2048",
    name: "2048",
    description: "Classic 2048 with a study twist",
    image: "/assets/study-blocks-320-177dd18d.webp",
    category: "puzzle",
  },
  {
    slug: "crossword",
    name: "Crossword",
    description: "Fill in the crossword with your knowledge",
    image: "/games/crossword.svg",
    category: "puzzle",
  },
  {
    slug: "flash",
    name: "FLASH",
    description: "Quick-fire flashcard game",
    image: "/games/flash.svg",
    category: "puzzle",
  },
  {
    slug: "study-chess",
    name: "Study Chess",
    description: "Strategic chess with quiz elements",
    image: "/assets/chess-320-3c105b59.webp",
    category: "puzzle",
    multiplayer: true,
  },
  {
    slug: "gem-recall",
    name: "Gem Recall",
    description: "Match gems by recalling answers",
    image: "/assets/gem-recall-9b5d4bc1.svg",
    category: "puzzle",
  },
  {
    slug: "tower-defense",
    name: "Tower Defense",
    description: "Build towers to defend with knowledge",
    image: "/assets/knowledge-towers-320-52dc7876.webp",
    category: "puzzle",
  },
  {
    slug: "connect-4",
    name: "Connect 4",
    description: "Classic Connect 4 with questions",
    image: "/assets/connect-learn-320-6eb63c7d.webp",
    category: "puzzle",
    multiplayer: true,
  },
  {
    slug: "tic-tac-toe",
    name: "Tic Tac Toe",
    description: "Tic tac toe with quiz twists",
    image: "/assets/tic-tac-quest-320-5365c421.webp",
    category: "puzzle",
    multiplayer: true,
  },
  {
    slug: "memory-match",
    name: "Memory Match",
    description: "Match pairs using your memory",
    image: "/assets/memory-match-320-a674c5eb.webp",
    category: "puzzle",
  },
  {
    slug: "tetris",
    name: "Tetris",
    description: "Stack blocks Tetris-style",
    image: "/assets/study-blocks-320-177dd18d.webp",
    category: "puzzle",
  },
  {
    slug: "bubble-shooter",
    name: "Bubble Shooter",
    description: "Pop bubbles with correct answers",
    image: "/assets/bubble-shooter-320-16712514.webp",
    category: "puzzle",
  },
  {
    slug: "block-blast",
    name: "Block Blast",
    description: "Blast blocks with knowledge",
    image: "/assets/block-burst-320-c961d544.webp",
    category: "puzzle",
  },
  {
    slug: "brain-breaker",
    name: "Brain Breaker",
    description: "Break through brain teasers",
    image: "/assets/brain-breaker-6323eab7.svg",
    category: "puzzle",
  },

  // ── Sports ─────────────────────────────────────────────────────────────
  {
    slug: "mini-golf",
    name: "Mini Golf",
    description: "Putt your way to victory",
    image: "/assets/putt-quest-68ed185b.svg",
    category: "sports",
  },
  {
    slug: "soccer",
    name: "Soccer",
    description: "Score goals with correct answers",
    image: "/assets/quiz-kicks-320-8526e386.webp",
    category: "sports",
    multiplayer: true,
  },
  {
    slug: "fishing",
    name: "Fishing",
    description: "Reel in fish with knowledge",
    image: "/assets/reel-genius-cefdef30.svg",
    category: "sports",
  },
  {
    slug: "horse-race",
    name: "Horse Race",
    description: "Race to the finish line",
    image: "/assets/swipe-learn-320-6ef0fd20.webp",
    category: "sports",
    multiplayer: true,
  },

  // ── RPG & Adventure ────────────────────────────────────────────────────
  {
    slug: "vault-heist",
    name: "Vault Heist",
    description:
      "Break into the vault by answering questions. Work with your team to crack the code.",
    image: "/assets/vault-heist-5f8bc8da.svg",
    category: "adventure",
    multiplayer: true,
    rating: 4.3,
    ratingCount: 498,
  },
  {
    slug: "study-sweep",
    name: "Study Sweep",
    description: "Sweep through dungeons",
    image: "/games/study-goblin/key-art.webp",
    category: "adventure",
  },
  {
    slug: "lanternfall",
    name: "Lanternfall",
    description: "Guide lanterns through the dark",
    image: "/assets/lanternfall-8aee6fb0.svg",
    category: "adventure",
  },
  {
    slug: "mind-vault",
    name: "Mind Vault",
    description: "Unlock the vaults of your mind",
    image: "/assets/dungeon-depths-9e8e0c2c.svg",
    category: "adventure",
  },
  {
    slug: "dungeon-depths",
    name: "Dungeon Depths",
    description: "Explore deep dungeons",
    image: "/assets/dungeon-depths-9e8e0c2c.svg",
    category: "adventure",
  },
  {
    slug: "boss-battle",
    name: "Boss Battle",
    description: "Battle epic bosses",
    image: "/assets/boss-battle-320-a3b32be5.webp",
    category: "adventure",
    multiplayer: true,
  },
  {
    slug: "buddy-battles",
    name: "Buddy Battles",
    description: "Battle with your study buddy",
    image: "/assets/buddy-battles-db2b9b07.svg",
    category: "adventure",
    multiplayer: true,
  },
  {
    slug: "spooky-manor",
    name: "Spooky Manor",
    description: "Explore the haunted manor",
    image: "/games/spooky-manor.svg",
    category: "adventure",
  },

  // ── Chill & Study ──────────────────────────────────────────────────────
  {
    slug: "space-academy",
    name: "Space Academy",
    description: "Study in outer space",
    image: "/games/space-academy/card.webp",
    category: "chill",
  },
  {
    slug: "study-buddy",
    name: "Study Buddy",
    description: "Your AI study companion",
    image: "/games/study-goblin/key-art.webp",
    category: "chill",
  },
  {
    slug: "study-village",
    name: "Study Village",
    description: "Build your study village",
    image: "/assets/study-village-c3aab9fe.svg",
    category: "chill",
  },
  {
    slug: "tinder",
    name: "Tinder",
    description: "Swipe to learn",
    image: "/assets/swipe-learn-320-6ef0fd20.webp",
    category: "chill",
  },
  {
    slug: "study-style",
    name: "Study Style",
    description: "Study with style",
    image: "/games/study-style.webp",
    category: "chill",
  },
  {
    slug: "study-garden",
    name: "Study Garden",
    description: "Grow your knowledge garden",
    image: "/games/study-garden.svg",
    category: "chill",
  },
  {
    slug: "flashcards",
    name: "Flashcards",
    description: "Classic flashcard study",
    image: "/assets/flashcards-320-08cbbfd0.webp",
    category: "chill",
  },
  {
    slug: "mindshore",
    name: "Mindshore",
    description: "Relax and study by the shore",
    image: "/assets/mindshore-5d8762de.svg",
    category: "chill",
  },

  // ── Immersive Worlds ───────────────────────────────────────────────────
  {
    slug: "night-library",
    name: "Night Library",
    description:
      "Explore a mysterious library at night. Answer questions to unlock books and discover hidden secrets.",
    image: "/games/night-library.webp",
    category: "worlds",
    rating: 4.5,
    ratingCount: 683,
  },
  {
    slug: "game-night",
    name: "Game Night",
    description: "Host a study game night",
    image: "/games/game-night.webp",
    category: "worlds",
    multiplayer: true,
  },
  {
    slug: "night-train",
    name: "Night Train",
    description: "Study on the night train",
    image: "/games/night-train.svg",
    category: "worlds",
  },
  {
    slug: "field-journal",
    name: "Field Journal",
    description: "Document your discoveries",
    image: "/games/field-journal.svg",
    category: "worlds",
  },
  {
    slug: "workshop",
    name: "Workshop",
    description: "Build and learn in the workshop",
    image: "/games/workshop.svg",
    category: "worlds",
  },
];
