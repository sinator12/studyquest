import { useState, useRef, type ChangeEvent } from "react";
import TopNav from "./TopNav";
import { extractTextFromFile, generateQuestionsFromContent } from "./aiService";
import {
  getActiveDeck,
  setActiveDeck,
  getSavedDecks,
  getAIConfig,
  setAIConfig,
  type DeckInfo,
  type AIProviderConfig
} from "./studyStore";
import "./dashboard.css";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"file" | "text" | "topic">("topic");
  const [topicInput, setTopicInput] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState<string>("");

  const [questionCount, setQuestionCount] = useState<number>(10);
  const [aiConfig, setLocalAIConfig] = useState<AIProviderConfig>(getAIConfig());
  const [showSettings, setShowSettings] = useState(false);

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStage, setProgressStage] = useState("Bean is chalking up today's menu.");
  const [progressPercent, setProgressPercent] = useState(15);
  const [warmupScore, setWarmupScore] = useState(0);
  const [warmupSelected, setWarmupSelected] = useState<number | null>(null);

  // Success state
  const [generatedDeck, setGeneratedDeck] = useState<DeckInfo | null>(getActiveDeck());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Warm-up trivia questions while generating
  const warmupQuestions = [
    { q: "Which is the largest ocean on Earth?", opts: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], c: 0 },
    { q: "How many minutes are in one hour?", opts: ["60", "100", "30", "120"], c: 0 },
    { q: "Which of these numbers is prime?", opts: ["17", "9", "15", "21"], c: 0 }
  ];
  const [currentWarmupIdx, setCurrentWarmupIdx] = useState(0);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const text = await extractTextFromFile(file);
      setFileText(text);
    }
  };

  const handleSaveAIConfig = (updated: Partial<AIProviderConfig>) => {
    const next = { ...aiConfig, ...updated };
    setLocalAIConfig(next);
    setAIConfig(next);
  };

  const handleGenerate = async () => {
    let contentToProcess = "";
    let source: "file" | "text" | "topic" = activeTab;

    if (activeTab === "topic") {
      contentToProcess = topicInput.trim() || "General Science & Trivia";
    } else if (activeTab === "text") {
      if (!pastedText.trim()) {
        alert("Please paste your study notes or chapter text first!");
        return;
      }
      contentToProcess = pastedText.trim();
    } else if (activeTab === "file") {
      if (!uploadedFile) {
        alert("Please select a file to upload!");
        return;
      }
      contentToProcess = fileText || uploadedFile.name;
    }

    setIsGenerating(true);
    setProgressPercent(20);
    setProgressStage("Bean is chalking up today's menu...");

    const progressInterval = setInterval(() => {
      setProgressPercent(p => (p < 85 ? p + 12 : p));
    }, 400);

    try {
      const result = await generateQuestionsFromContent(contentToProcess, source, {
        count: questionCount,
        onProgress: (stage) => setProgressStage(stage)
      });

      clearInterval(progressInterval);
      setProgressPercent(100);

      const newDeck: DeckInfo = {
        id: "deck-" + Date.now(),
        title: result.title,
        sourceType: source,
        fileName: uploadedFile?.name,
        questionCount: result.questions.length,
        createdAt: Date.now(),
        questions: result.questions
      };

      setActiveDeck(newDeck);
      setGeneratedDeck(newDeck);
      setTimeout(() => {
        setIsGenerating(false);
      }, 700);
    } catch (err: any) {
      clearInterval(progressInterval);
      setIsGenerating(false);
      alert("Error generating questions: " + (err?.message || "Unknown error"));
    }
  };

  const handleWarmupAnswer = (idx: number) => {
    setWarmupSelected(idx);
    if (idx === warmupQuestions[currentWarmupIdx].c) {
      setWarmupScore(s => s + 1);
    }
    setTimeout(() => {
      setWarmupSelected(null);
      setCurrentWarmupIdx(i => (i + 1) % warmupQuestions.length);
    }, 1000);
  };

  return (
    <div className="sq-dash-page">
      <TopNav activeTab="dashboard" />

      <main className="sq-dash-container">
        {/* Hero banner matching video */}
        <section className="sq-dash-hero">
          <div className="sq-dash-hero-left">
            {/* Animated Gamepad Mascot */}
            <div className="sq-mascot-wrap">
              <svg viewBox="0 0 100 100" width="90" height="90" className="sq-mascot-svg">
                <rect x="15" y="32" width="70" height="48" rx="24" fill="#7C3AED" />
                <path d="M25 45Q50 25 75 45" stroke="#FFA826" strokeWidth="12" strokeLinecap="round" />
                {/* Brain lobes */}
                <circle cx="40" cy="28" r="14" fill="#FFA826" />
                <circle cx="60" cy="28" r="14" fill="#FFA826" />
                <circle cx="50" cy="24" r="12" fill="#FFC83D" />
                {/* Controller details */}
                <circle cx="36" cy="54" r="3.5" fill="#FFF" />
                <circle cx="64" cy="54" r="3.5" fill="#FFF" />
                <path d="M44 64Q50 70 56 64" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" />
                {/* Dpad & buttons */}
                <path d="M22 56H28M25 53V59" stroke="#E9D5FF" strokeWidth="2" strokeLinecap="round" />
                <circle cx="76" cy="54" r="2" fill="#E9D5FF" />
                <circle cx="80" cy="58" r="2" fill="#E9D5FF" />
              </svg>
            </div>

            <div className="sq-hero-bubble">
              <h1>Ready, Unli? Let's make your first game.</h1>
              <p>Add something you're studying. I write the questions, you pick the game.</p>
              
              <div className="sq-steps-row">
                <span className="sq-step-item active">
                  <span className="sq-step-num">1</span>
                  <span>Add your notes</span>
                </span>
                <span className="sq-step-line" />
                <span className={`sq-step-item ${isGenerating || generatedDeck ? "active" : ""}`}>
                  <span className="sq-step-num">2</span>
                  <span>Get your questions</span>
                </span>
                <span className="sq-step-line" />
                <span className={`sq-step-item ${generatedDeck ? "active" : ""}`}>
                  <span className="sq-step-num">3</span>
                  <span>Play</span>
                </span>
              </div>
            </div>
          </div>

          <div className="sq-dash-hero-right">
            <div className="sq-today-card">
              <div className="sq-today-head">
                <span className="sq-today-title">Today</span>
                <span className="sq-streak-badge">🔥 1-day streak</span>
              </div>
              <p className="sq-today-sub">
                {generatedDeck ? `${generatedDeck.questions.length} questions loaded` : "Haven't studied today yet"}
              </p>
              <a href="/games" className="sq-start-link">Explore Games →</a>
            </div>

            <div className="sq-premium-banner">
              <div className="sq-premium-head">
                <span>👑 Premium</span>
                <button type="button" className="sq-close-x">✕</button>
              </div>
              <p>Master more of your syllabus with bigger uploads and harder questions from the Advanced AI model.</p>
              <button type="button" className="sq-see-plans-btn">See plans</button>
            </div>
          </div>
        </section>

        {/* LOADING MODAL (Matching the video: Bean chalking up today's menu + warm-up round) */}
        {isGenerating && (
          <div className="sq-loading-overlay">
            <div className="sq-loading-box">
              {/* Cute Robot reading a book */}
              <div className="sq-loading-robot">
                <svg viewBox="0 0 120 120" width="100" height="100">
                  {/* Floating rocket fire */}
                  <polygon points="60,95 52,112 68,112" fill="#F43F5E" />
                  <polygon points="60,98 56,110 64,110" fill="#FFA826" />
                  {/* Body */}
                  <rect x="42" y="52" width="36" height="36" rx="8" fill="#FFFFFF" stroke="#1E293B" strokeWidth="3" />
                  <rect x="50" y="60" width="20" height="12" rx="4" fill="#38BDF8" />
                  {/* Head */}
                  <rect x="36" y="20" width="48" height="30" rx="14" fill="#1E293B" />
                  <ellipse cx="48" cy="35" rx="5" ry="6" fill="#38BDF8" />
                  <ellipse cx="72" cy="35" rx="5" ry="6" fill="#38BDF8" />
                  {/* Open book */}
                  <path d="M42 75Q60 70 60 84Q60 70 78 75L78 86Q60 81 60 92Q60 81 42 86Z" fill="#F43F5E" stroke="#1E293B" strokeWidth="2" />
                </svg>
              </div>

              <h3>{progressStage}</h3>
              <div className="sq-progress-bar-wrap">
                <div className="sq-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="sq-progress-sub">Usually takes about 10–25s</p>

              {/* Warm-up round right inside the loading screen */}
              <div className="sq-warmup-card">
                <div className="sq-warmup-head">
                  <span className="sq-warmup-tag">WARM-UP ROUND</span>
                  <span className="sq-warmup-streak">🔥 Warm-up streak: {warmupScore}</span>
                </div>
                <p className="sq-warmup-q">{warmupQuestions[currentWarmupIdx].q}</p>
                <div className="sq-warmup-options">
                  {warmupQuestions[currentWarmupIdx].opts.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`sq-warmup-opt ${warmupSelected === i ? (i === warmupQuestions[currentWarmupIdx].c ? "correct" : "wrong") : ""}`}
                      onClick={() => handleWarmupAnswer(i)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Methods Section */}
        <section className="sq-input-card">
          <div className="sq-input-head">
            <div>
              <h2>What are you studying?</h2>
              <p>Pick the way that's easiest right now. You can add more later.</p>
            </div>
            
            {/* AI Provider configuration toggle */}
            <button
              type="button"
              className="sq-ai-settings-toggle"
              onClick={() => setShowSettings(!showSettings)}
            >
              ⚙️ AI Provider ({aiConfig.provider === "gemini" ? "Gemini" : aiConfig.provider === "openai" ? "OpenAI" : "Built-in"})
            </button>
          </div>

          {/* AI Settings Drawer */}
          {showSettings && (
            <div className="sq-ai-settings-panel">
              <div className="sq-settings-row">
                <label>AI Generator Provider:</label>
                <div className="sq-provider-radios">
                  <button
                    type="button"
                    className={`sq-provider-pill ${aiConfig.provider === "builtin" ? "active" : ""}`}
                    onClick={() => handleSaveAIConfig({ provider: "builtin" })}
                  >
                    ⚡ Built-in StudyQuest AI (Free & Offline)
                  </button>
                  <button
                    type="button"
                    className={`sq-provider-pill ${aiConfig.provider === "gemini" ? "active" : ""}`}
                    onClick={() => handleSaveAIConfig({ provider: "gemini" })}
                  >
                    🌟 Google Gemini API
                  </button>
                  <button
                    type="button"
                    className={`sq-provider-pill ${aiConfig.provider === "openai" ? "active" : ""}`}
                    onClick={() => handleSaveAIConfig({ provider: "openai" })}
                  >
                    🤖 OpenAI ChatGPT
                  </button>
                </div>
              </div>

              {aiConfig.provider === "gemini" && (
                <div className="sq-key-input-row">
                  <label htmlFor="gemini-key">Gemini API Key:</label>
                  <input
                    id="gemini-key"
                    type="password"
                    placeholder="AIzaSy..."
                    value={aiConfig.geminiKey}
                    onChange={(e) => handleSaveAIConfig({ geminiKey: e.target.value })}
                  />
                  <small>Get a free key from Google AI Studio</small>
                </div>
              )}

              {aiConfig.provider === "openai" && (
                <div className="sq-key-input-row">
                  <label htmlFor="openai-key">OpenAI API Key:</label>
                  <input
                    id="openai-key"
                    type="password"
                    placeholder="sk-..."
                    value={aiConfig.openaiKey}
                    onChange={(e) => handleSaveAIConfig({ openaiKey: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          {/* 3 Main Method Tabs */}
          <div className="sq-method-tabs">
            <button
              type="button"
              className={`sq-method-btn ${activeTab === "file" ? "active" : ""}`}
              onClick={() => setActiveTab("file")}
            >
              <div className="sq-method-icon file-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              </div>
              <div className="sq-method-meta">
                <strong>Upload a file</strong>
                <small>PDF, slides, Word and more</small>
              </div>
            </button>

            <button
              type="button"
              className={`sq-method-btn ${activeTab === "text" ? "active" : ""}`}
              onClick={() => setActiveTab("text")}
            >
              <div className="sq-method-icon text-icon">
                <span className="sq-t-icon">T</span>
              </div>
              <div className="sq-method-meta">
                <strong>Paste text</strong>
                <small>Notes or a chapter you can copy</small>
              </div>
            </button>

            <button
              type="button"
              className={`sq-method-btn ${activeTab === "topic" ? "active" : ""}`}
              onClick={() => setActiveTab("topic")}
            >
              <div className="sq-method-icon topic-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6m-4 4h2M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6v1h8v-1c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" /></svg>
              </div>
              <div className="sq-method-meta">
                <strong>Type a topic</strong>
                <small>No notes? Type what you want to learn</small>
              </div>
            </button>
          </div>

          {/* Tab 1: File Upload */}
          {activeTab === "file" && (
            <div className="sq-tab-content sq-dropzone-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf,.docx,.doc,.csv,.json"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <div
                className="sq-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="sq-drop-icon">📁</div>
                <h4>{uploadedFile ? uploadedFile.name : "Choose a file or drag & drop"}</h4>
                <p>Supports PDF, DOCX, TXT, Markdown, slides</p>
                {uploadedFile && (
                  <span className="sq-file-success">
                    ✓ File loaded: {(uploadedFile.size / 1024).toFixed(1)} KB ({fileText.slice(0, 100).length} characters detected)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Paste Text */}
          {activeTab === "text" && (
            <div className="sq-tab-content">
              <textarea
                className="sq-paste-textarea"
                rows={6}
                placeholder="Paste your reviewer notes, chapter summary, definitions, or study guide here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
              <div className="sq-sample-prompts">
                <span>Try sample notes:</span>
                <button
                  type="button"
                  className="sq-sample-btn"
                  onClick={() => setPastedText("Photosynthesis: The process by which green plants and certain other organisms transform light energy into chemical energy. Chlorophyll absorbs blue and red light. Light reactions take place in the thylakoid membranes, producing ATP and NADPH. The Calvin cycle occurs in the stroma to fix carbon dioxide into glucose.")}
                >
                  🌿 Photosynthesis
                </button>
                <button
                  type="button"
                  className="sq-sample-btn"
                  onClick={() => setPastedText("World War II (1939-1945): Global conflict involving the Axis powers (Germany, Italy, Japan) and Allies (US, Britain, USSR, China). Key milestones: Invasion of Poland (1939), Battle of Stalingrad (1942), D-Day Normandy Landings (June 6, 1944), Atomic bombings of Hiroshima and Nagasaki (1945).")}
                >
                  ⚔️ World War II
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Type a Topic */}
          {activeTab === "topic" && (
            <div className="sq-tab-content">
              <div className="sq-topic-input-wrap">
                <input
                  type="text"
                  className="sq-topic-input"
                  placeholder="e.g. Cell Biology, Spanish Vocabulary, World War II, Calculus, Solar System..."
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                />
              </div>
              <div className="sq-sample-prompts">
                <span>Popular topics:</span>
                {["Human Anatomy", "World Geography", "JavaScript Basics", "Ancient Rome", "Solar System", "Organic Chemistry"].map(t => (
                  <button
                    key={t}
                    type="button"
                    className="sq-sample-btn"
                    onClick={() => setTopicInput(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Actions & Controls */}
          <div className="sq-input-footer">
            <div className="sq-question-count-picker">
              <span>Generate:</span>
              {[5, 10, 15, 20].map(n => (
                <button
                  key={n}
                  type="button"
                  className={`sq-count-pill ${questionCount === n ? "active" : ""}`}
                  onClick={() => setQuestionCount(n)}
                >
                  {n} Qs
                </button>
              ))}
            </div>

            <button
              type="button"
              className="sq-generate-btn"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
              <span>{isGenerating ? "Generating..." : "Generate Study Questions"}</span>
            </button>
          </div>
        </section>

        {/* Ready to Play Banner */}
        {generatedDeck && (
          <section className="sq-ready-banner">
            <div className="sq-ready-content">
              <span className="sq-ready-badge">✓ Active Reviewer Ready</span>
              <h3>{generatedDeck.title}</h3>
              <p>{generatedDeck.questions.length} questions generated & loaded into all games!</p>
            </div>
            <div className="sq-ready-actions">
              <a href="/games/study-cafe" className="sq-btn-play-cafe">
                ☕ Play Study Café
              </a>
              <a href="/games/angry-nerds" className="sq-btn-play-nerds">
                🎯 Play Angry Nerds
              </a>
              <a href="/games" className="sq-btn-browse-all">
                🎮 All Games
              </a>
            </div>
          </section>
        )}

        {/* Saved Study Library Section */}
        <section className="sq-library-section">
          <h3>Your Study Library</h3>
          <p>Your saved reviewer decks are ready to play across any game mode.</p>

          <div className="sq-library-grid">
            {getSavedDecks().length === 0 ? (
              <div className="sq-library-empty">
                <span>📚</span>
                <h4>Your library will hold your uploaded sets.</h4>
                <p>Generate your first deck above to see it here!</p>
              </div>
            ) : (
              getSavedDecks().map(deckItem => (
                <div key={deckItem.id} className="sq-deck-card">
                  <div className="sq-deck-badge">{deckItem.questionCount} Questions</div>
                  <h4>{deckItem.title}</h4>
                  <small>Created {new Date(deckItem.createdAt).toLocaleDateString()}</small>
                  <div className="sq-deck-actions">
                    <button
                      type="button"
                      className="sq-deck-load-btn"
                      onClick={() => {
                        setActiveDeck(deckItem);
                        setGeneratedDeck(deckItem);
                      }}
                    >
                      {generatedDeck?.id === deckItem.id ? "✓ Currently Active" : "Set as Active"}
                    </button>
                    <a href="/games/study-cafe" className="sq-deck-play-link">Play →</a>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
