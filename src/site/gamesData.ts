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
    slug: "classroom",
    label: "Classroom & Study",
    color: "rgb(59, 130, 246)",
    description: "Run a café and serve customers by answering notes from your review material."
  },
  {
    slug: "arcade",
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
  { id: "classroom", label: "Study Café", color: "rgb(59, 130, 246)" },
  { id: "arcade", label: "Angry Nerds", color: "rgb(242, 84, 45)" }
];

// ---------------------------------------------------------------------------
// Popular slugs
// ---------------------------------------------------------------------------
export const POPULAR_SLUGS: string[] = [
  "study-cafe",
  "angry-nerds"
];

// ---------------------------------------------------------------------------
// Games Catalog (Strictly Study Café and Angry Nerds only)
// ---------------------------------------------------------------------------
export const GAMES: Game[] = [
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
    category: "arcade",
    multiplayer: false,
    rating: 4.8,
    ratingCount: 980,
    isNew: true
  }
];
