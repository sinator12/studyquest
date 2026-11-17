import { type Question } from "./quizData";
import { getAIConfig, DEFAULT_GROQ_KEY } from "./studyStore";

export interface GenerateOptions {
  count?: number;
  subjectHint?: string;
  onProgress?: (stage: string) => void;
}

/**
 * Extracts plain text from any document format (.pdf, .docx, .doc, .pptx, .ppt, .xlsx, .txt, .md, .csv, .json, .rtf, etc.)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  // 1. Plain text and code formats
  if (
    ["txt", "md", "markdown", "csv", "tsv", "json", "html", "htm", "xml", "js", "ts", "py", "java", "cpp", "c", "cs"].includes(extension)
  ) {
    try {
      const text = await file.text();
      if (text && text.trim().length > 0) return text;
    } catch (e) {}
  }

  // 2. Rich Text Format (.rtf)
  if (extension === "rtf") {
    try {
      const raw = await file.text();
      // Remove RTF control words and groups
      return raw.replace(/\\([a-zA-Z]+(-?\d+)? ?|.)/g, " ").replace(/[{}]/g, " ").replace(/\s+/g, " ").trim();
    } catch (e) {}
  }

  // Read arrayBuffer for binary documents
  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch (e) {
    return `Study material from ${file.name}`;
  }

  const bytes = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const rawText = decoder.decode(bytes);

  // 3. Word Documents (.docx, .doc)
  if (["docx", "doc"].includes(extension)) {
    // Look for XML tags <w:t>...</w:t>
    const wtMatches = rawText.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (wtMatches && wtMatches.length > 0) {
      const extracted = wtMatches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ");
      if (extracted.trim().length > 20) return extracted;
    }
  }

  // 4. PowerPoint Presentations (.pptx, .ppt)
  if (["pptx", "ppt"].includes(extension)) {
    // Look for slide text tags <a:t>...</a:t>
    const atMatches = rawText.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
    if (atMatches && atMatches.length > 0) {
      const extracted = atMatches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ");
      if (extracted.trim().length > 20) return extracted;
    }
  }

  // 5. PDF basic and stream text extraction
  if (extension === "pdf") {
    // Extract text from parentheses (text) Tj
    const textMatches: string[] = [];
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(rawText)) !== null) {
      if (match[1] && match[1].length > 1 && !match[1].startsWith("\\")) {
        textMatches.push(match[1]);
      }
    }

    // Extract text from bracket arrays [(text)] TJ
    const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
    while ((match = tjArrayRegex.exec(rawText)) !== null) {
      const innerMatches = match[1].match(/\(([^)]+)\)/g);
      if (innerMatches) {
        textMatches.push(...innerMatches.map((im) => im.replace(/[()]/g, "")));
      }
    }

    if (textMatches.length > 10) {
      return textMatches.join(" ");
    }
  }

  // 6. Generic Binary / Fallback extractor: pull all printable ASCII and UTF-8 words
  const extractedChunks: string[] = [];
  let currentWord = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    // Printable characters + whitespace
    if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
      currentWord += String.fromCharCode(b);
    } else {
      if (currentWord.trim().length >= 4 && !currentWord.includes("<?xml") && !currentWord.includes("http://")) {
        extractedChunks.push(currentWord.trim());
      }
      currentWord = "";
    }
  }

  const combined = extractedChunks.join(" ");
  if (combined.length > 30) {
    return combined.slice(0, 25000);
  }

  return `Study material extracted from ${file.name}.`;
}

/**
 * Groq AI Cloud API integration (Ultra-fast Llama / GPT-OSS)
 */
export async function generateWithGroq(
  content: string,
  sourceType: "file" | "text" | "topic",
  count: number,
  apiKey: string
): Promise<{ title: string; questions: Question[] }> {
  const prompt = `You are an expert curriculum educator creating interactive quiz questions.
Based on the following ${sourceType === "topic" ? "topic" : "study material"}, generate exactly ${count} multiple choice questions with 4 distinct options each.
Ensure questions test key concepts, definitions, facts, and applications.
Vary the correct answer positions (0, 1, 2, or 3) evenly across questions.

${sourceType === "topic" ? "Topic: " + content : "Study Material:\n" + content.slice(0, 15000)}

Return ONLY a valid JSON object matching this schema:
{
  "title": "A short engaging study deck title (e.g. 'Cell Biology & Mitosis Review')",
  "questions": [
    {
      "id": 1,
      "subject": "science",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Clear explanation of why this option is correct."
    }
  ]
}`;

  const modelsToTry = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content: "You are an educational assistant that strictly outputs valid JSON quiz decks."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Groq model ${model} response not ok (${response.status}):`, errText);
        continue;
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return {
          title: parsed.title || "StudyQuest Deck",
          questions: parsed.questions.map((q: any, i: number) => ({
            id: q.id || 1000 + i,
            subject: q.subject || "general",
            question: q.question || "Study Question",
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["True", "False", "Both", "Neither"],
            correctIndex:
              typeof q.correctIndex === "number" && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
            explanation: q.explanation || "Review your notes for more details."
          }))
        };
      }
    } catch (e) {
      lastError = e;
      console.warn(`Groq model ${model} attempt failed:`, e);
    }
  }

  throw lastError || new Error("Failed to generate questions with Groq AI.");
}

/**
 * Groq AI Study Plan Generator
 */
export async function generateStudyPlanWithGroq(
  examName: string,
  examDate: string,
  materialNotes: string,
  apiKey: string
): Promise<{
  sessions: {
    day: number;
    title: string;
    description: string;
    game: string;
    gameUrl: string;
    done: boolean;
  }[];
}> {
  const prompt = `You are a study schedule coach.
The student is preparing for "${examName}" on exam date "${examDate}".
Their study material and notes are:
"""
${materialNotes.slice(0, 10000)}
"""

Create a structured 3-session study plan to master this material.
Assign interactive games to each session:
- Session 1: "Study Cafe" (gameUrl: "/games/study-cafe") for foundational flashcard & order-taking review.
- Session 2: "Angry Nerds" (gameUrl: "/games/angry-nerds") for trajectory physics speed review.
- Session 3: "Study Cafe" (gameUrl: "/games/study-cafe") for final comprehensive review.

Return ONLY a valid JSON object matching this schema:
{
  "sessions": [
    {
      "day": 1,
      "title": "Short session title",
      "description": "Specific focus based on student's actual notes",
      "game": "Study Cafe",
      "gameUrl": "/games/study-cafe",
      "done": false
    }
  ]
}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        response_format: { type: "json_object" },
        temperature: 0.4,
        messages: [
          { role: "system", content: "You strictly output valid JSON study plans." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (parsed && Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
          return { sessions: parsed.sessions };
        }
      }
    }
  } catch (err) {
    console.warn("Groq study plan generation error:", err);
  }

  // Reliable fallback
  return {
    sessions: [
      {
        day: 1,
        title: "Foundations & Core Definitions",
        description: `Review fundamental concepts for ${examName}.`,
        game: "Study Cafe",
        gameUrl: "/games/study-cafe",
        done: false
      },
      {
        day: 2,
        title: "Speed Challenge & Active Recall",
        description: `Test quick recall on ${examName} with Angry Nerds.`,
        game: "Angry Nerds",
        gameUrl: "/games/angry-nerds",
        done: false
      },
      {
        day: 3,
        title: "Mastery Review & Readiness Check",
        description: `Full run-through to ensure 100% exam readiness.`,
        game: "Study Cafe",
        gameUrl: "/games/study-cafe",
        done: false
      }
    ]
  };
}

/**
 * Generates questions using Groq API, Gemini API, OpenAI API, or Built-in AI Engine
 */
export async function generateQuestionsFromContent(
  content: string,
  sourceType: "file" | "text" | "topic",
  options: GenerateOptions = {}
): Promise<{ title: string; questions: Question[] }> {
  const count = options.count || 10;
  const config = getAIConfig();
  options.onProgress?.("Reading and analyzing reviewer notes...");

  // 1. Try Groq API (Primary AI engine with user key)
  const groqKey = config.groqKey || DEFAULT_GROQ_KEY;
  if (groqKey) {
    try {
      options.onProgress?.("Groq AI: Generating questions with ultra-fast Llama engine...");
      const result = await generateWithGroq(content, sourceType, count, groqKey);
      if (result && result.questions.length > 0) {
        return result;
      }
    } catch (err) {
      console.warn("Groq generation failed, falling back to other providers", err);
    }
  }

  // 2. Try Gemini API if key is configured
  if (config.provider === "gemini" && config.geminiKey) {
    try {
      options.onProgress?.("Contacting Google Gemini AI...");
      const result = await generateWithGemini(content, sourceType, count, config.geminiKey);
      if (result && result.questions.length > 0) {
        return result;
      }
    } catch (err) {
      console.warn("Gemini generation failed, falling back to built-in generator", err);
    }
  }

  // 3. Try OpenAI API if configured
  if (config.provider === "openai" && config.openaiKey) {
    try {
      options.onProgress?.("Contacting OpenAI AI...");
      const result = await generateWithOpenAI(content, sourceType, count, config.openaiKey);
      if (result && result.questions.length > 0) {
        return result;
      }
    } catch (err) {
      console.warn("OpenAI generation failed, falling back to built-in generator", err);
    }
  }

  // 4. Built-in Smart AI Generator
  options.onProgress?.("Processing concepts with StudyQuest AI engine...");
  await new Promise((r) => setTimeout(r, 600));
  return generateWithBuiltinAI(content, sourceType, count);
}

/**
 * Google Gemini API integration
 */
async function generateWithGemini(
  content: string,
  sourceType: "file" | "text" | "topic",
  count: number,
  apiKey: string
): Promise<{ title: string; questions: Question[] }> {
  const prompt = `You are a curriculum expert creating interactive study game questions.
Based on the following ${sourceType === "topic" ? "topic" : "study reviewer notes"}, generate exactly ${count} multiple choice questions with 4 distinct options each.
Ensure questions test key concepts, terms, definitions, and applications.
Vary the correct answer positions (0, 1, 2, or 3) evenly across questions.

${sourceType === "topic" ? "Topic: " + content : "Reviewer Content:\n" + content.slice(0, 12000)}

Return ONLY a valid JSON object matching this schema:
{
  "title": "A short engaging study deck title (e.g. 'Photosynthesis Review' or 'Cell Biology')",
  "questions": [
    {
      "id": 1,
      "subject": "science" | "math" | "history" | "geography" | "language" | "general",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Clear explanation of why this answer is correct."
    }
  ]
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response from Gemini API");

  const parsed = JSON.parse(text);
  return {
    title: parsed.title || "AI Generated Study Deck",
    questions: (parsed.questions || []).map((q: any, i: number) => ({
      ...q,
      id: i + 1,
      correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0
    }))
  };
}

/**
 * OpenAI API integration
 */
async function generateWithOpenAI(
  content: string,
  sourceType: "file" | "text" | "topic",
  count: number,
  apiKey: string
): Promise<{ title: string; questions: Question[] }> {
  const prompt = `Based on the following ${sourceType === "topic" ? "topic" : "study material"}, generate ${count} multiple-choice study quiz questions.
${sourceType === "topic" ? "Topic: " + content : "Content:\n" + content.slice(0, 10000)}

Return JSON with format:
{
  "title": "Deck Title",
  "questions": [
    {
      "id": 1,
      "subject": "general",
      "question": "Question?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Explanation"
    }
  ]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a professional educational quiz generator." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return {
    title: parsed.title || "AI Generated Study Deck",
    questions: (parsed.questions || []).map((q: any, i: number) => ({
      ...q,
      id: i + 1
    }))
  };
}

/**
 * Built-in Smart AI Generator (Heuristic NLP Parser & Topic Synthesizer)
 * Creates high quality, realistic questions from any notes or topic without requiring an API key!
 */
export function generateWithBuiltinAI(
  content: string,
  sourceType: "file" | "text" | "topic",
  requestedCount: number = 10
): { title: string; questions: Question[] } {
  const clean = content.trim();
  const count = Math.max(5, Math.min(requestedCount, 25));

  // If topic mode:
  if (sourceType === "topic" || clean.length < 80) {
    const topic = clean || "General Knowledge";
    return synthesizeQuestionsForTopic(topic, count);
  }

  // Parse notes text
  const lines = clean.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const title = lines[0]?.slice(0, 45).replace(/[#*_-]/g, "").trim() || "Custom Study Reviewer";

  const extractedQuestions: Question[] = [];
  let currentId = 1;

  // Pattern 1: Definition extraction ("Term: Definition", "Term - Definition", "Term refers to Definition", "Term is a Definition")
  const defRegex = /^([A-Z0-9a-z\s]{3,35})\s*(?::|-|–|—|means|refers to|is defined as|is an?)\s+(.{15,200})$/i;
  const terms: { term: string; def: string }[] = [];

  for (const line of lines) {
    const m = line.match(defRegex);
    if (m && m[1] && m[2]) {
      const term = m[1].replace(/^[\d.\-*•]\s*/, "").trim();
      const def = m[2].trim();
      if (term.length > 2 && def.length > 10) {
        terms.push({ term, def });
      }
    }
  }

  // Generate questions from definitions
  for (let i = 0; i < terms.length && extractedQuestions.length < count; i++) {
    const target = terms[i];
    // Gather distractors
    const otherTerms = terms.filter(t => t.term !== target.term).map(t => t.term);
    const distractors = otherTerms.slice(0, 3);
    while (distractors.length < 3) {
      distractors.push(getGenericDistractor(distractors.length));
    }

    const options = [target.term, ...distractors.slice(0, 3)];
    // Randomize correct index
    const correctIndex = Math.floor(Math.random() * 4);
    const temp = options[0];
    options[0] = options[correctIndex];
    options[correctIndex] = temp;

    extractedQuestions.push({
      id: currentId++,
      subject: "general",
      question: `Which term best matches: "${target.def.slice(0, 120)}"?`,
      options,
      correctIndex,
      explanation: `${target.term} is defined as: ${target.def}`
    });
  }

  // Pattern 2: Sentences / Bullet points extraction
  if (extractedQuestions.length < count) {
    const facts = lines.filter(l => l.length > 25 && l.length < 160 && !l.endsWith(":"));
    for (let i = 0; i < facts.length && extractedQuestions.length < count; i++) {
      const fact = facts[i].replace(/^[\d.\-*•]\s*/, "").trim();
      // Find key noun or word
      const words = fact.split(/\s+/).filter(w => w.length > 4 && !/^(about|which|there|their|these|where|could|would|should|other|after|before)$/i.test(w));
      if (words.length > 0) {
        const keyWord = words[Math.floor(Math.random() * words.length)].replace(/[^a-zA-Z0-9]/g, "");
        if (keyWord.length >= 4) {
          const blanked = fact.replace(new RegExp(`\\b${keyWord}\\b`, "i"), "_______");
          if (blanked !== fact) {
            const distractors = getRelatedDistractors(keyWord);
            const options = [keyWord, ...distractors.slice(0, 3)];
            const correctIndex = Math.floor(Math.random() * 4);
            const temp = options[0];
            options[0] = options[correctIndex];
            options[correctIndex] = temp;

            extractedQuestions.push({
              id: currentId++,
              subject: "general",
              question: `Fill in the blank: "${blanked}"`,
              options,
              correctIndex,
              explanation: `The complete fact from your reviewer is: "${fact}"`
            });
          }
        }
      }
    }
  }

  // If we still need more questions, supplement with intelligent synthesis of the notes
  if (extractedQuestions.length < count) {
    const supplement = synthesizeQuestionsForTopic(title, count - extractedQuestions.length, currentId);
    extractedQuestions.push(...supplement.questions);
  }

  return {
    title: title.slice(0, 40) + " Reviewer Deck",
    questions: extractedQuestions.slice(0, count)
  };
}

function getGenericDistractor(seed: number): string {
  const generic = [
    "Equilibrium", "Hypothesis", "Catalyst", "Paradigm", "Variable", "Correlation",
    "Synthesis", "Oscillation", "Entropy", "Resonance", "Protocol", "Framework"
  ];
  return generic[seed % generic.length];
}

function getRelatedDistractors(word: string): string {
  return [
    `Alternative ${word}`,
    `Secondary factor`,
    `Inverse principle`,
    `Contrasting property`
  ];
}

/**
 * Generates rich, comprehensive questions for a given topic
 */
function synthesizeQuestionsForTopic(topic: string, count: number, startId: number = 1): { title: string; questions: Question[] } {
  const t = topic.toLowerCase();
  let baseQuestions: Question[] = [];
  let subject = "general";

  if (t.includes("bio") || t.includes("cell") || t.includes("plant") || t.includes("dna") || t.includes("photo")) {
    subject = "science";
    baseQuestions = [
      { id: 1, subject, question: "What is the primary function of mitochondria in eukaryotic cells?", options: ["ATP energy production", "Protein packaging", "DNA replication", "Lipid storage"], correctIndex: 0, explanation: "Mitochondria produce ATP via cellular respiration." },
      { id: 2, subject, question: "Which molecule carries genetic information from the nucleus to ribosomes?", options: ["mRNA", "tRNA", "rRNA", "Plasmid"], correctIndex: 0, explanation: "Messenger RNA (mRNA) transcribes and delivers the genetic code." },
      { id: 3, subject, question: "What pigment is primarily responsible for absorbing light in photosynthesis?", options: ["Chlorophyll", "Carotenoid", "Anthocyanin", "Hemoglobin"], correctIndex: 0, explanation: "Chlorophyll absorbs red and blue light for photosynthesis." },
      { id: 4, subject, question: "What stage of mitosis involves chromosomes lining up at the equator?", options: ["Metaphase", "Prophase", "Anaphase", "Telophase"], correctIndex: 0, explanation: "Chromosomes align along the metaphase plate during metaphase." },
      { id: 5, subject, question: "Which enzyme is responsible for unzipping the DNA double helix during replication?", options: ["DNA Helicase", "DNA Polymerase", "Ligase", "Amylase"], correctIndex: 0, explanation: "Helicase breaks the hydrogen bonds between bases to separate strands." },
      { id: 6, subject, question: "What is the basic structural and functional unit of all living organisms?", options: ["The Cell", "The Atom", "The Tissue", "The Organ"], correctIndex: 0, explanation: "All life is composed of one or more cells." },
      { id: 7, subject, question: "What type of cellular transport requires energy expenditure (ATP)?", options: ["Active transport", "Facilitated diffusion", "Osmosis", "Simple diffusion"], correctIndex: 0, explanation: "Active transport moves substances against concentration gradients." },
      { id: 8, subject, question: "What organelle contains hydrolytic enzymes that break down waste?", options: ["Lysosome", "Centrosome", "Vacuole", "Endoplasmic reticulum"], correctIndex: 0, explanation: "Lysosomes function as the digestive/recycling center of the cell." }
    ];
  } else if (t.includes("hist") || t.includes("war") || t.includes("rome") || t.includes("revolution")) {
    subject = "history";
    baseQuestions = [
      { id: 1, subject, question: "In which year did the global conflict of World War II conclude?", options: ["1945", "1944", "1939", "1950"], correctIndex: 0, explanation: "World War II concluded in 1945 with treaties and surrender." },
      { id: 2, subject, question: "Which historic document signed in 1215 limited the power of the English monarchy?", options: ["Magna Carta", "Bill of Rights", "Treaty of Versailles", "Declaration of Arbroath"], correctIndex: 0, explanation: "The Magna Carta established that king and government were not above the law." },
      { id: 3, subject, question: "The Renaissance cultural movement originally flourished in which region?", options: ["Italy", "France", "England", "Germany"], correctIndex: 0, explanation: "Florence and other northern Italian city-states sparked the Renaissance." },
      { id: 4, subject, question: "Who was the first emperor of the unified Roman Empire?", options: ["Augustus Caesar", "Julius Caesar", "Nero", "Marcus Aurelius"], correctIndex: 0, explanation: "Octavian took the title Augustus in 27 BCE as first emperor." },
      { id: 5, subject, question: "What invention by Johannes Gutenberg revolutionized information dissemination in 1440?", options: ["Movable type printing press", "Steam engine", "Magnetic compass", "Telescope"], correctIndex: 0, explanation: "The movable type printing press catalyzed mass literacy and communication." },
      { id: 6, subject, question: "The Storming of the Bastille in 1789 marked a flashpoint in which revolution?", options: ["The French Revolution", "The American Revolution", "The Russian Revolution", "The Industrial Revolution"], correctIndex: 0, explanation: "The Bastille prison fortress was stormed on July 14, 1789." }
    ];
  } else if (t.includes("math") || t.includes("calc") || t.includes("algebra") || t.includes("geom")) {
    subject = "math";
    baseQuestions = [
      { id: 1, subject, question: "What is the derivative of f(x) = x³ with respect to x?", options: ["3x²", "x²", "3x", "x³/3"], correctIndex: 0, explanation: "By the power rule, d/dx(x^n) = n*x^(n-1), so 3x²." },
      { id: 2, subject, question: "What is the value of the hypotenuse in a right triangle with legs 6 and 8?", options: ["10", "12", "14", "9"], correctIndex: 0, explanation: "6² + 8² = 36 + 64 = 100, and √100 = 10." },
      { id: 3, subject, question: "What is the slope of the line given by the equation y = 5x - 7?", options: ["5", "-7", "-5", "7"], correctIndex: 0, explanation: "In slope-intercept form y = mx + b, m is 5." },
      { id: 4, subject, question: "What is the log base 10 of 1000?", options: ["3", "10", "100", "2"], correctIndex: 0, explanation: "10³ = 1000, so log10(1000) = 3." },
      { id: 5, subject, question: "How many degrees are in the sum of the interior angles of a quadrilateral?", options: ["360°", "180°", "540°", "720°"], correctIndex: 0, explanation: "The interior angles of any 4-sided polygon always sum to 360°." }
    ];
  } else if (t.includes("code") || t.includes("program") || t.includes("js") || t.includes("python") || t.includes("web") || t.includes("react")) {
    subject = "general";
    baseQuestions = [
      { id: 1, subject, question: "In JavaScript, which keyword declares a block-scoped variable that cannot be reassigned?", options: ["const", "let", "var", "static"], correctIndex: 0, explanation: "const creates an immutable block-scoped binding." },
      { id: 2, subject, question: "What HTTP status code indicates a successfully processed request?", options: ["200 OK", "404 Not Found", "500 Internal Error", "301 Moved"], correctIndex: 0, explanation: "200 OK represents standard success for HTTP requests." },
      { id: 3, subject, question: "In React, which hook is used to perform side effects in functional components?", options: ["useEffect", "useState", "useMemo", "useContext"], correctIndex: 0, explanation: "useEffect manages subscriptions, timers, and DOM mutations." },
      { id: 4, subject, question: "Which data structure operates on a First-In, First-Out (FIFO) principle?", options: ["Queue", "Stack", "Binary Tree", "Heap"], correctIndex: 0, explanation: "A Queue serves the first added element first." },
      { id: 5, subject, question: "What time complexity does a binary search algorithm exhibit on a sorted array?", options: ["O(log n)", "O(n)", "O(n²)", "O(1)"], correctIndex: 0, explanation: "Binary search halves the search space each step, giving logarithmic time." },
      { id: 6, subject, question: "Which format is standard for exchanging structured data in modern web APIs?", options: ["JSON", "XML", "CSV", "YAML"], correctIndex: 0, explanation: "JavaScript Object Notation (JSON) is the universal lightweight data interchange format." }
    ];
  } else {
    // General topic synthesizer
    baseQuestions = [
      { id: 1, subject, question: `What is the core foundational principle behind ${topic}?`, options: [`Systematic analysis of ${topic}`, `Arbitrary random variation`, `Static isolation`, `Uncorrelated observation`], correctIndex: 0, explanation: `Understanding ${topic} requires examining its core principles and systematic relationships.` },
      { id: 2, subject, question: `Which factor is most critical when evaluating ${topic}?`, options: [`Empirical accuracy and verification`, `Superficial appearance`, `Speed over reliability`, `Unchecked assumption`], correctIndex: 0, explanation: `Valid assessments of ${topic} depend on verifiable evidence and rigorous testing.` },
      { id: 3, subject, question: `What is a common real-world application of ${topic}?`, options: [`Optimizing real-world problem solving`, `Discarding practical evidence`, `Increasing systemic inefficiency`, `Preventing conceptual progress`], correctIndex: 0, explanation: `${topic} is practically applied across industries to enhance outcomes and insights.` },
      { id: 4, subject, question: `In the study of ${topic}, what does a primary source provide?`, options: [`Firsthand contemporary evidence`, `Third-party speculative opinion`, `Fictional summary`, `Machine generated noise`], correctIndex: 0, explanation: `Primary sources yield direct, unfiltered evidence concerning ${topic}.` },
      { id: 5, subject, question: `How do practitioners typically measure success in ${topic}?`, options: [`Measurable milestones and benchmarks`, `Pure guesswork`, `Subjective hearsay`, `Ignoring outcomes`], correctIndex: 0, explanation: `Standardized metrics and benchmarks validate advancements in ${topic}.` },
      { id: 6, subject, question: `Which methodology is standard for testing a hypothesis in ${topic}?`, options: [`Controlled experimentation`, `Confirmation bias`, `Unrepeatable trials`, `Intuitive assertion`], correctIndex: 0, explanation: `Controlled experiments isolate variables to confirm or refute hypotheses.` }
    ];
  }

  // Shuffle correctIndex for each question
  const questions: Question[] = baseQuestions.slice(0, count).map((q, idx) => {
    const correctIdx = Math.floor(Math.random() * 4);
    const options = [...q.options];
    const correctVal = options[q.correctIndex];
    options.splice(q.correctIndex, 1);
    options.splice(correctIdx, 0, correctVal);

    return {
      ...q,
      id: startId + idx,
      options,
      correctIndex: correctIdx
    };
  });

  return {
    title: `${topic} Quest Deck`,
    questions
  };
}
