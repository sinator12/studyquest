export interface Question {
  id: number;
  subject: string; // "science", "math", "history", "geography", "language", "general"
  question: string;
  options: string[];
  correctIndex: number; // 0-3
  explanation?: string;
}

export const QUESTIONS: Question[] = [
  // ─── Science (10) ───────────────────────────────────────────────
  {
    id: 1,
    subject: "science",
    question: "What is the chemical symbol for water?",
    options: ["H₂O", "CO₂", "NaCl", "O₂"],
    correctIndex: 0,
    explanation: "Water is composed of two hydrogen atoms and one oxygen atom: H₂O.",
  },
  {
    id: 2,
    subject: "science",
    question: "What planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctIndex: 1,
    explanation: "Mars appears red due to iron oxide (rust) on its surface.",
  },
  {
    id: 3,
    subject: "science",
    question: "What is the powerhouse of the cell?",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi body"],
    correctIndex: 2,
    explanation: "Mitochondria generate most of the cell's supply of ATP, the energy currency.",
  },
  {
    id: 4,
    subject: "science",
    question: "What gas do plants absorb from the atmosphere?",
    options: ["O₂", "CO₂", "N₂", "H₂"],
    correctIndex: 1,
    explanation: "Plants absorb carbon dioxide (CO₂) and use it in photosynthesis.",
  },
  {
    id: 5,
    subject: "science",
    question: "What is the speed of light approximately?",
    options: ["150,000 km/s", "500,000 km/s", "300,000 km/s", "1,000,000 km/s"],
    correctIndex: 2,
    explanation: "Light travels at approximately 300,000 km/s in a vacuum.",
  },
  {
    id: 6,
    subject: "science",
    question: "What is the hardest natural substance?",
    options: ["Quartz", "Topaz", "Ruby", "Diamond"],
    correctIndex: 3,
    explanation: "Diamond scores 10 on the Mohs hardness scale, the highest possible.",
  },
  {
    id: 7,
    subject: "science",
    question: "How many bones does an adult human have?",
    options: ["186", "206", "226", "256"],
    correctIndex: 1,
    explanation: "An adult human skeleton consists of 206 bones.",
  },
  {
    id: 8,
    subject: "science",
    question: "What is the largest organ in the human body?",
    options: ["Liver", "Brain", "Skin", "Heart"],
    correctIndex: 2,
    explanation: "The skin is the body's largest organ, covering about 20 square feet.",
  },
  {
    id: 9,
    subject: "science",
    question: "What type of energy does the sun primarily emit?",
    options: ["Kinetic", "Electromagnetic", "Potential", "Nuclear"],
    correctIndex: 1,
    explanation: "The sun emits electromagnetic radiation including visible light, UV, and infrared.",
  },
  {
    id: 10,
    subject: "science",
    question: "What element does 'O' represent on the periodic table?",
    options: ["Osmium", "Oxygen", "Oganesson", "Oleum"],
    correctIndex: 1,
    explanation: "O is the chemical symbol for Oxygen, atomic number 8.",
  },

  // ─── Math (10) ──────────────────────────────────────────────────
  {
    id: 11,
    subject: "math",
    question: "What is 15% of 200?",
    options: ["25", "30", "35", "20"],
    correctIndex: 1,
    explanation: "15% of 200 = 0.15 × 200 = 30.",
  },
  {
    id: 12,
    subject: "math",
    question: "What is the square root of 144?",
    options: ["14", "11", "12", "13"],
    correctIndex: 2,
    explanation: "12 × 12 = 144, so √144 = 12.",
  },
  {
    id: 13,
    subject: "math",
    question: "What is the value of π (pi) to two decimal places?",
    options: ["3.41", "3.14", "3.12", "3.16"],
    correctIndex: 1,
    explanation: "Pi (π) is approximately 3.14159..., rounded to 3.14.",
  },
  {
    id: 14,
    subject: "math",
    question: "If x + 7 = 15, what is x?",
    options: ["7", "9", "8", "6"],
    correctIndex: 2,
    explanation: "x = 15 - 7 = 8.",
  },
  {
    id: 15,
    subject: "math",
    question: "What is the area of a circle with radius 5?",
    options: ["31.42", "50", "78.54", "25"],
    correctIndex: 2,
    explanation: "Area = π × r² = π × 25 ≈ 78.54.",
  },
  {
    id: 16,
    subject: "math",
    question: "What is 2⁸?",
    options: ["128", "256", "512", "64"],
    correctIndex: 1,
    explanation: "2⁸ = 256.",
  },
  {
    id: 17,
    subject: "math",
    question: "How many sides does a hexagon have?",
    options: ["5", "7", "6", "8"],
    correctIndex: 2,
    explanation: "A hexagon has 6 sides. The prefix 'hex' means six.",
  },
  {
    id: 18,
    subject: "math",
    question: "What is the next prime number after 7?",
    options: ["9", "13", "10", "11"],
    correctIndex: 3,
    explanation: "After 7, the next prime is 11 (8, 9, and 10 are composite).",
  },
  {
    id: 19,
    subject: "math",
    question: "What is 3/4 as a percentage?",
    options: ["60%", "80%", "75%", "70%"],
    correctIndex: 2,
    explanation: "3 ÷ 4 = 0.75 = 75%.",
  },
  {
    id: 20,
    subject: "math",
    question: "What is the sum of angles in a triangle?",
    options: ["360°", "180°", "270°", "90°"],
    correctIndex: 1,
    explanation: "The interior angles of any triangle always add up to 180°.",
  },

  // ─── History (10) ───────────────────────────────────────────────
  {
    id: 21,
    subject: "history",
    question: "In what year did World War II end?",
    options: ["1944", "1946", "1945", "1943"],
    correctIndex: 2,
    explanation: "World War II ended in 1945 with the surrender of Japan.",
  },
  {
    id: 22,
    subject: "history",
    question: "Who was the first president of the United States?",
    options: ["Thomas Jefferson", "George Washington", "Abraham Lincoln", "John Adams"],
    correctIndex: 1,
    explanation: "George Washington served as the first U.S. president from 1789 to 1797.",
  },
  {
    id: 23,
    subject: "history",
    question:
      "The Great Wall of China was primarily built to protect against invasions from the?",
    options: ["South", "North", "East", "West"],
    correctIndex: 1,
    explanation: "The Great Wall was built to defend China's northern borders from nomadic invaders.",
  },
  {
    id: 24,
    subject: "history",
    question: "Who painted the Mona Lisa?",
    options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"],
    correctIndex: 2,
    explanation: "Leonardo da Vinci painted the Mona Lisa, likely between 1503 and 1519.",
  },
  {
    id: 25,
    subject: "history",
    question: "What ancient civilization built the pyramids at Giza?",
    options: ["Romans", "Egyptians", "Greeks", "Persians"],
    correctIndex: 1,
    explanation: "The ancient Egyptians built the pyramids at Giza around 2560 BC.",
  },
  {
    id: 26,
    subject: "history",
    question: "In which year did the Titanic sink?",
    options: ["1912", "1905", "1920", "1898"],
    correctIndex: 0,
    explanation: "The RMS Titanic sank on April 15, 1912, after hitting an iceberg.",
  },
  {
    id: 27,
    subject: "history",
    question: "Who wrote the Declaration of Independence?",
    options: ["Benjamin Franklin", "James Madison", "Thomas Jefferson", "John Adams"],
    correctIndex: 2,
    explanation: "Thomas Jefferson was the principal author of the Declaration of Independence.",
  },
  {
    id: 28,
    subject: "history",
    question: "The Renaissance began in which country?",
    options: ["France", "Italy", "England", "Spain"],
    correctIndex: 1,
    explanation: "The Renaissance originated in Italy during the 14th century.",
  },
  {
    id: 29,
    subject: "history",
    question: "What was the name of the ship Columbus sailed to America?",
    options: ["Mayflower", "Victoria", "Santa María", "Endeavour"],
    correctIndex: 2,
    explanation: "Columbus's flagship was the Santa María on his 1492 voyage.",
  },
  {
    id: 30,
    subject: "history",
    question: "Who was known as the Iron Lady?",
    options: ["Queen Victoria", "Margaret Thatcher", "Indira Gandhi", "Angela Merkel"],
    correctIndex: 1,
    explanation: "Margaret Thatcher, UK Prime Minister 1979–1990, was nicknamed the Iron Lady.",
  },

  // ─── Geography (10) ─────────────────────────────────────────────
  {
    id: 31,
    subject: "geography",
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Pacific", "Arctic"],
    correctIndex: 2,
    explanation: "The Pacific Ocean covers about 63 million square miles.",
  },
  {
    id: 32,
    subject: "geography",
    question: "What is the capital of Japan?",
    options: ["Tokyo", "Kyoto", "Osaka", "Hiroshima"],
    correctIndex: 0,
    explanation: "Tokyo has been the capital of Japan since 1868.",
  },
  {
    id: 33,
    subject: "geography",
    question: "Which continent is the Sahara Desert located in?",
    options: ["Asia", "Africa", "Australia", "South America"],
    correctIndex: 1,
    explanation: "The Sahara Desert spans much of North Africa.",
  },
  {
    id: 34,
    subject: "geography",
    question: "What is the longest river in the world?",
    options: ["Amazon", "Nile", "Mississippi", "Yangtze"],
    correctIndex: 1,
    explanation: "The Nile River stretches approximately 6,650 km through northeastern Africa.",
  },
  {
    id: 35,
    subject: "geography",
    question: "Which country has the most population?",
    options: ["China", "USA", "India", "Indonesia"],
    correctIndex: 2,
    explanation: "India surpassed China as the world's most populous country.",
  },
  {
    id: 36,
    subject: "geography",
    question: "What is the smallest country in the world?",
    options: ["Monaco", "San Marino", "Vatican City", "Nauru"],
    correctIndex: 2,
    explanation: "Vatican City is the smallest country at about 44 hectares (110 acres).",
  },
  {
    id: 37,
    subject: "geography",
    question: "Mount Everest is located in which mountain range?",
    options: ["Andes", "Himalayas", "Alps", "Rockies"],
    correctIndex: 1,
    explanation: "Mount Everest is part of the Himalayan mountain range.",
  },
  {
    id: 38,
    subject: "geography",
    question: "What is the largest island in the world?",
    options: ["Madagascar", "Greenland", "Borneo", "New Guinea"],
    correctIndex: 1,
    explanation: "Greenland covers about 2.17 million km², making it the world's largest island.",
  },
  {
    id: 39,
    subject: "geography",
    question: "Which river flows through London?",
    options: ["Seine", "Thames", "Danube", "Rhine"],
    correctIndex: 1,
    explanation: "The River Thames flows through London and is 346 km long.",
  },
  {
    id: 40,
    subject: "geography",
    question: "In which country would you find the Great Barrier Reef?",
    options: ["Brazil", "Australia", "Indonesia", "Philippines"],
    correctIndex: 1,
    explanation: "The Great Barrier Reef is located off the coast of Queensland, Australia.",
  },

  // ─── Language Arts (10) ─────────────────────────────────────────
  {
    id: 41,
    subject: "language",
    question: 'What is a synonym for "happy"?',
    options: ["Sad", "Joyful", "Angry", "Tired"],
    correctIndex: 1,
    explanation: '"Joyful" means feeling great pleasure or happiness.',
  },
  {
    id: 42,
    subject: "language",
    question: "Which of these is a verb?",
    options: ["Beautiful", "Run", "Quickly", "Happiness"],
    correctIndex: 1,
    explanation: '"Run" is a verb — it describes an action.',
  },
  {
    id: 43,
    subject: "language",
    question: 'What figure of speech is "The world is a stage"?',
    options: ["Simile", "Hyperbole", "Metaphor", "Irony"],
    correctIndex: 2,
    explanation: "A metaphor directly compares two unlike things without using 'like' or 'as'.",
  },
  {
    id: 44,
    subject: "language",
    question: 'Who wrote "Romeo and Juliet"?',
    options: ["Shakespeare", "Dickens", "Austen", "Hemingway"],
    correctIndex: 0,
    explanation: "William Shakespeare wrote Romeo and Juliet around 1594–1596.",
  },
  {
    id: 45,
    subject: "language",
    question: 'What is the plural of "mouse"?',
    options: ["Mouses", "Mice", "Meese", "Mices"],
    correctIndex: 1,
    explanation: '"Mice" is the irregular plural form of "mouse".',
  },
  {
    id: 46,
    subject: "language",
    question: 'What is an antonym for "ancient"?',
    options: ["Old", "Historic", "Modern", "Classic"],
    correctIndex: 2,
    explanation: '"Modern" means the opposite of "ancient" — relating to the present.',
  },
  {
    id: 47,
    subject: "language",
    question: "Which is a proper noun?",
    options: ["city", "London", "building", "river"],
    correctIndex: 1,
    explanation: "Proper nouns name specific people, places, or things and are capitalized.",
  },
  {
    id: 48,
    subject: "language",
    question: 'What does the prefix "un-" mean?',
    options: ["Again", "Not", "Before", "After"],
    correctIndex: 1,
    explanation: 'The prefix "un-" means "not" or indicates reversal, e.g., unhappy, undo.',
  },
  {
    id: 49,
    subject: "language",
    question: '"She sells seashells" is an example of?',
    options: ["Metaphor", "Onomatopoeia", "Simile", "Alliteration"],
    correctIndex: 3,
    explanation: "Alliteration is the repetition of initial consonant sounds in nearby words.",
  },
  {
    id: 50,
    subject: "language",
    question: 'What is the past tense of "go"?',
    options: ["Gone", "Going", "Goed", "Went"],
    correctIndex: 3,
    explanation: '"Went" is the irregular past tense of "go".',
  },

  // ─── General Knowledge (10) ────────────────────────────────────
  {
    id: 51,
    subject: "general",
    question: "How many continents are there?",
    options: ["5", "6", "7", "8"],
    correctIndex: 2,
    explanation:
      "There are 7 continents: Africa, Antarctica, Asia, Australia, Europe, North America, South America.",
  },
  {
    id: 52,
    subject: "general",
    question: "What color do you get when you mix red and blue?",
    options: ["Green", "Purple", "Orange", "Brown"],
    correctIndex: 1,
    explanation: "Mixing red and blue pigments produces purple.",
  },
  {
    id: 53,
    subject: "general",
    question: "How many strings does a standard guitar have?",
    options: ["4", "6", "8", "5"],
    correctIndex: 1,
    explanation: "A standard guitar has 6 strings.",
  },
  {
    id: 54,
    subject: "general",
    question: "What sport is played at Wimbledon?",
    options: ["Cricket", "Tennis", "Golf", "Football"],
    correctIndex: 1,
    explanation: "Wimbledon is the oldest and most prestigious tennis tournament in the world.",
  },
  {
    id: 55,
    subject: "general",
    question: "How many days are in a leap year?",
    options: ["365", "364", "366", "367"],
    correctIndex: 2,
    explanation: "A leap year has 366 days, with February having 29 days instead of 28.",
  },
  {
    id: 56,
    subject: "general",
    question: "What is the currency of Japan?",
    options: ["Won", "Yuan", "Yen", "Rupee"],
    correctIndex: 2,
    explanation: "The Japanese yen (¥) is the official currency of Japan.",
  },
  {
    id: 57,
    subject: "general",
    question: "How many players are on a soccer team?",
    options: ["9", "11", "12", "10"],
    correctIndex: 1,
    explanation: "A standard soccer (football) team has 11 players on the field.",
  },
  {
    id: 58,
    subject: "general",
    question: 'What animal is known as the "King of the Jungle"?',
    options: ["Tiger", "Lion", "Elephant", "Bear"],
    correctIndex: 1,
    explanation: "The lion is traditionally known as the King of the Jungle.",
  },
  {
    id: 59,
    subject: "general",
    question: "Which instrument has 88 keys?",
    options: ["Organ", "Accordion", "Piano", "Synthesizer"],
    correctIndex: 2,
    explanation: "A standard piano has 88 keys — 52 white and 36 black.",
  },
  {
    id: 60,
    subject: "general",
    question: "What is the boiling point of water in Celsius?",
    options: ["90°C", "110°C", "212°C", "100°C"],
    correctIndex: 3,
    explanation: "Water boils at 100°C (212°F) at standard atmospheric pressure.",
  },
];

/** Shuffles an array in place using the Fisher-Yates algorithm and returns it. */
export function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Returns a shuffled subset of questions, optionally filtered by subject. */
export function getQuestions(count: number, subject?: string): Question[] {
  let pool = QUESTIONS;
  if (subject) {
    pool = pool.filter((q) => q.subject === subject);
  }
  const shuffled = shuffle(pool);
  return shuffled.slice(0, count);
}
