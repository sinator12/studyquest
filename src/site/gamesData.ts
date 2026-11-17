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
  {
    slug: "arcade",
    label: "Bingo & Arcade",
    color: "rgb(234, 88, 12)",
    description: "Draw numbered balls, stamp your 5x5 grid, and call BINGO against the Hall Regulars!"
  },
  {
    slug: "classroom",
    label: "Classroom & Study",
    color: "rgb(59, 130, 246)",
    description: "Run a café and serve customers by answering notes from your review material."
  },
  {
    slug: "action",
    label: "Action & Arcade",
    color: "rgb(242, 84, 45)",
    description: "Launch nerdy characters using trajectory physics to destroy obstacles and recall facts."
  }
];

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------
export const FILTER_TABS: FilterTab[] = [
  { id: "all", label: "All Games" },
  { id: "arcade", label: "Bingo Night", color: "rgb(234, 88, 12)" },
  { id: "classroom", label: "Study Café", color: "rgb(59, 130, 246)" },
  { id: "action", label: "Angry Nerds", color: "rgb(242, 84, 45)" }
];

// ---------------------------------------------------------------------------
// Popular slugs
// ---------------------------------------------------------------------------
export const POPULAR_SLUGS: string[] = [
  "bingo-night",
  "study-cafe",
  "angry-nerds"
];

// ---------------------------------------------------------------------------
// Games Catalog
// ---------------------------------------------------------------------------
export const GAMES: Game[] = [
  {
    slug: "bingo-night",
    name: "Bingo Night",
    description:
      "Answer study questions to draw balls, stamp matching squares on your 5x5 card, and race against the Hall Regulars to call BINGO!",
    image: "/assets/bingo-night-6e8da9df.svg",
    category: "arcade",
    multiplayer: true,
    rating: 4.9,
    ratingCount: 1680,
    isNew: true
  },
  {
    slug: "study-cafe",
    name: "Study Café",
    description:
      "Run a café where each order is a question from your study notes. Serve the matching menu item to earn stars and money, pay the rent, and upgrade your café!",
    image: "/games/study-cafe.webp",
    category: "classroom",
    multiplayer: true,
    rating: 4.9,
    ratingCount: 1420,
    isNew: false
  },
  {
    slug: "angry-nerds",
    name: "Angry Nerds",
    description:
      "Launch nerdy characters with slingshot physics to smash structures, topple obstacles, and solve quick-fire review questions!",
    image: "/games/angry-nerds.svg",
    category: "action",
    multiplayer: false,
    rating: 4.8,
    ratingCount: 980,
    isNew: true
  }
];
