import { useState, useRef, useEffect, type ChangeEvent } from "react";
import TopNav from "./TopNav";
import GoogleLoginModal from "./GoogleLoginModal";
import {
  getCurrentUser,
  isDemoMode,
  getDemoUsage,
  incrementDemoUsage,
  DEMO_LIMITS,
  type UserProfile
} from "./authStore";
import {
  extractDocumentDetails,
  generateQuestionsFromContent,
  type DocumentExtractionResult
} from "./aiService";
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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getCurrentUser());
  const [demoMode, setDemoMode] = useState<boolean>(isDemoMode());
  const [demoUsage, setDemoUsage] = useState(getDemoUsage());
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"file" | "text" | "topic">("topic");
  const [topicInput, setTopicInput] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState<string>("");
  const [fileMeta, setFileMeta] = useState<DocumentExtractionResult | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [lastSourceContent, setLastSourceContent] = useState<{
    content: string;
    sourceType: "file" | "text" | "topic";
  } | null>(null);

  const [questionCount, setQuestionCount] = useState<number>(demoMode ? DEMO_LIMITS.maxQuestionsPerDeck : 10);
  const [aiConfig, setLocalAIConfig] = useState<AIProviderConfig>(getAIConfig());
  const [showSettings, setShowSettings] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStage, setProgressStage] = useState("Preparing your questions...");
  const [progressPercent, setProgressPercent] = useState(15);
  const [warmupScore, setWarmupScore] = useState(0);
  const [warmupSelected, setWarmupSelected] = useState<number | null>(null);

  // Success state
  const [generatedDeck, setGeneratedDeck] = useState<DeckInfo | null>(getActiveDeck());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleAuthChange = () => {
      const nextDemo = isDemoMode();
      setCurrentUser(getCurrentUser());
      setDemoMode(nextDemo);
      setDemoUsage(getDemoUsage());
      setGeneratedDeck(getActiveDeck());
      if (nextDemo) {
        setQuestionCount(DEMO_LIMITS.maxQuestionsPerDeck);
        if (activeTab === "file") setActiveTab("topic");
      }
    };
    const handleDemoUpdate = () => setDemoUsage(getDemoUsage());
    window.addEventListener("sq_auth_changed", handleAuthChange);
    window.addEventListener("sq_demo_updated", handleDemoUpdate);
    return () => {
      window.removeEventListener("sq_auth_changed", handleAuthChange);
      window.removeEventListener("sq_demo_updated", handleDemoUpdate);
    };
  }, [activeTab]);

  const warmupQuestions = [
    { q: "Which is the largest ocean on Earth?", opts: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], c: 0 },
    { q: "How many minutes are in one hour?", opts: ["60", "100", "30", "120"], c: 0 },
    { q: "Which of these numbers is prime?", opts: ["17", "9", "15", "21"], c: 0 }
  ];
  const [currentWarmupIdx, setCurrentWarmupIdx] = useState(0);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorBanner(null);
    setUploadedFile(file);
    setIsReadingFile(true);
    try {
      const details = await extractDocumentDetails(file);
      setFileMeta(details);
      setFileText(details.text);
      if (details.warning && details.charCount < 20) {
        setErrorBanner(details.warning);
      }
    } catch {
      setErrorBanner(`Could not read "${file.name}".`);
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleSaveAIConfig = (updated: Partial<AIProviderConfig>) => {
    const next = { ...aiConfig, ...updated };
    setLocalAIConfig(next);
    setAIConfig(next);
  };

  const runGeneration = async (
    contentToProcess: string,
    source: "file" | "text" | "topic",
    excludeQuestions: string[] = []
  ) => {
    setErrorBanner(null);
    if (demoMode && demoUsage.decksGenerated >= DEMO_LIMITS.maxDecks) {
      setLoginModalOpen(true);
      return;
    }

    const effectiveCount = demoMode ? DEMO_LIMITS.maxQuestionsPerDeck : questionCount;
    setIsGenerating(true);
    setProgressPercent(20);
    setProgressStage("Analyzing your study material...");

    const progressInterval = window.setInterval(() => {
      setProgressPercent((p) => (p < 85 ? p + 12 : p));
    }, 350);

    try {
      const result = await generateQuestionsFromContent(contentToProcess, source, {
        count: effectiveCount,
        seed: Date.now(),
        excludeQuestions,
        onProgress: (stage) => setProgressStage(stage)
      });

      window.clearInterval(progressInterval);
      setProgressPercent(100);

      const newDeck: DeckInfo = {
        id: "deck-" + Date.now(),
        title: result.title,
        sourceType: source,
        fileName: uploadedFile?.name,
        contentPreview: contentToProcess.slice(0, 6000),
        questionCount: result.questions.length,
        createdAt: Date.now(),
        questions: result.questions
      };

      setActiveDeck(newDeck);
      setGeneratedDeck(newDeck);
      setLastSourceContent({ content: contentToProcess, sourceType: source });

      if (demoMode) {
        setDemoUsage(incrementDemoUsage("decksGenerated"));
      }

      window.setTimeout(() => {
        setIsGenerating(false);
      }, 450);
    } catch (err: any) {
      window.clearInterval(progressInterval);
      setIsGenerating(false);
      setErrorBanner("Error generating questions: " + (err?.message || "Unknown error"));
    }
  };

  const handleGenerate = async () => {
    let contentToProcess = "";
    const source: "file" | "text" | "topic" = activeTab;

    if (activeTab === "topic") {
      contentToProcess = topicInput.trim() || "General Science & Trivia";
    } else if (activeTab === "text") {
      if (!pastedText.trim()) {
        setErrorBanner("Please paste your study notes or chapter text first.");
        return;
      }
      contentToProcess = pastedText.trim();
    } else if (activeTab === "file") {
      if (demoMode) {
        setLoginModalOpen(true);
        return;
      }
      if (!uploadedFile) {
        setErrorBanner("Please select a document to upload first.");
        return;
      }
      if (!fileText || fileText.trim().length < 20) {
        setErrorBanner(
          fileMeta?.warning ||
            "No readable text was extracted from this file. Try a text-based PDF, DOCX, PPTX, or paste notes."
        );
        return;
      }
      contentToProcess = fileText;
    }

    await runGeneration(contentToProcess, source);
  };

  const handleRegenerateFresh = async () => {
    const exclude = generatedDeck?.questions.map((q) => q.question) || [];
    const fallbackContent =
      lastSourceContent?.content ||
      generatedDeck?.contentPreview ||
      generatedDeck?.title ||
      "General Knowledge";
    const fallbackSource =
      lastSourceContent?.sourceType ||
      (generatedDeck?.sourceType === "sample" ? "topic" : generatedDeck?.sourceType) ||
      "topic";

    await runGeneration(fallbackContent, fallbackSource, exclude);
  };

  const handleWarmupAnswer = (idx: number) => {
    setWarmupSelected(idx);
    if (idx === warmupQuestions[currentWarmupIdx].c) {
      setWarmupScore((s) => s + 1);
    }
    window.setTimeout(() => {
      setWarmupSelected(null);
      setCurrentWarmupIdx((i) => (i + 1) % warmupQuestions.length);
    }, 900);
  };

  const demoRemaining = Math.max(0, DEMO_LIMITS.maxDecks - demoUsage.decksGenerated);

  return (
    <div className="sq-dash-page">
      <TopNav activeTab="dashboard" />

      <main className="sq-dash-container">
        {/* Hero banner */}
        <section className="sq-dash-hero">
          <div className="sq-dash-hero-left">
            <div className="sq-mascot-wrap" aria-hidden="true">
              <svg viewBox="0 0 100 100" width="90" height="90" className="sq-mascot-svg">
                <rect x="15" y="32" width="70" height="48" rx="24" fill="#7C3AED" />
                <path d="M25 45Q50 25 75 45" stroke="#FFA826" strokeWidth="12" strokeLinecap="round" />
                <circle cx="40" cy="28" r="14" fill="#FFA826" />
                <circle cx="60" cy="28" r="14" fill="#FFA826" />
                <circle cx="50" cy="24" r="12" fill="#FFC83D" />
                <circle cx="36" cy="54" r="3.5" fill="#FFF" />
                <circle cx="64" cy="54" r="3.5" fill="#FFF" />
                <path d="M44 64Q50 70 56 64" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M22 56H28M25 53V59" stroke="#E9D5FF" strokeWidth="2" strokeLinecap="round" />
                <circle cx="76" cy="54" r="2" fill="#E9D5FF" />
                <circle cx="80" cy="58" r="2" fill="#E9D5FF" />
              </svg>
            </div>

            <div className="sq-hero-bubble">
              <h1>
                {currentUser
                  ? `Ready, ${currentUser.name}? Let's build your next study game.`
                  : "Demo Preview: Build a 5-question study deck."}
              </h1>
              <p>Add notes, upload a document, or pick a topic. EduQuest turns it into playable rounds.</p>

              <div className="sq-steps-row">
                <span className="sq-step-item active">
                  <span className="sq-step-num">1</span>
                  <span>Add material</span>
                </span>
                <span className="sq-step-line" />
                <span className={`sq-step-item ${isGenerating || generatedDeck ? "active" : ""}`}>
                  <span className="sq-step-num">2</span>
                  <span>Generate deck</span>
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
                <span className="sq-streak-badge">
                  {demoMode ? `${demoRemaining}/${DEMO_LIMITS.maxDecks} Demo left` : "Ready to play"}
                </span>
              </div>
              <p className="sq-today-sub">
                {generatedDeck
                  ? `${generatedDeck.questions.length} questions loaded in your active deck`
                  : "No active deck loaded yet"}
              </p>
              <a href="/games" className="sq-start-link">
                Explore Games →
              </a>
            </div>
          </div>
        </section>

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="sq-loading-overlay">
            <div className="sq-loading-box">
              <h3>{progressStage}</h3>
              <div className="sq-progress-bar-wrap">
                <div className="sq-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="sq-progress-sub">Extracting concepts and balancing answer options</p>

              <div className="sq-warmup-card">
                <div className="sq-warmup-head">
                  <span className="sq-warmup-tag">WARM-UP QUESTION</span>
                  <span className="sq-warmup-streak">Score: {warmupScore}</span>
                </div>
                <p className="sq-warmup-q">{warmupQuestions[currentWarmupIdx].q}</p>
                <div className="sq-warmup-options">
                  {warmupQuestions[currentWarmupIdx].opts.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`sq-warmup-opt ${
                        warmupSelected === i
                          ? i === warmupQuestions[currentWarmupIdx].c
                            ? "correct"
                            : "wrong"
                          : ""
                      }`}
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

        {/* Input Methods Card */}
        <section className="sq-input-card">
          <div className="sq-input-head">
            <div>
              <h2>What are you studying?</h2>
              <p>Pick an input method to generate fresh, non-repeating questions.</p>
            </div>

            <button
              type="button"
              className="sq-ai-settings-toggle"
              onClick={() => setShowSettings(!showSettings)}
            >
              AI Engine:{" "}
              {aiConfig.provider === "nvidia"
                ? "NVIDIA (Main)"
                : aiConfig.provider === "groq"
                ? "Groq (Secondary)"
                : aiConfig.provider === "gemini"
                ? "Gemini"
                : aiConfig.provider === "openai"
                ? "OpenAI"
                : "Built-in"}
            </button>
          </div>

          {showSettings && (
            <div className="sq-ai-settings-panel">
              <div className="sq-settings-row">
                <label>Question Generator Provider</label>
                <div className="sq-provider-radios">
                  <button
                    type="button"
                    className={`sq-provider-pill ${aiConfig.provider === "nvidia" ? "active" : ""}`}
                    onClick={() => handleSaveAIConfig({ provider: "nvidia" })}
                  >
                    NVIDIA AI (Main)
                  </button>
                  <button
                    type="button"
                    className={`sq-provider-pill ${aiConfig.provider === "groq" ? "active" : ""}`}
                    onClick={() => handleSaveAIConfig({ provider: "groq" })}
                  >
                    Groq AI (Secondary)
                  </button>
                  <button
                    type="button"
                    className={`sq-provider-pill ${aiConfig.provider === "builtin" ? "active" : ""}`}
                    onClick={() => handleSaveAIConfig({ provider: "builtin" })}
                  >
                    Built-in NLP (Offline)
                  </button>
                  <button
                    type="button"
                    className={`sq-provider-pill ${aiConfig.provider === "gemini" ? "active" : ""}`}
                    onClick={() => handleSaveAIConfig({ provider: "gemini" })}
                  >
                    Google Gemini
                  </button>
                  <button
                    type="button"
                    className={`sq-provider-pill ${aiConfig.provider === "openai" ? "active" : ""}`}
                    onClick={() => handleSaveAIConfig({ provider: "openai" })}
                  >
                    OpenAI
                  </button>
                </div>
              </div>

              {aiConfig.provider === "gemini" && (
                <div className="sq-key-input-row">
                  <label htmlFor="gemini-key">Gemini API Key</label>
                  <input
                    id="gemini-key"
                    type="password"
                    placeholder="AIzaSy..."
                    value={aiConfig.geminiKey}
                    onChange={(e) => handleSaveAIConfig({ geminiKey: e.target.value })}
                  />
                </div>
              )}

              {aiConfig.provider === "openai" && (
                <div className="sq-key-input-row">
                  <label htmlFor="openai-key">OpenAI API Key</label>
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

          {errorBanner && (
            <div className="sq-dash-alert" role="alert">
              <span>{errorBanner}</span>
            </div>
          )}

          {/* 3 Main Method Tabs */}
          <div className="sq-method-tabs">
            <button
              type="button"
              className={`sq-method-btn ${activeTab === "file" ? "active" : ""} ${demoMode ? "locked" : ""}`}
              onClick={() => {
                if (demoMode) {
                  setLoginModalOpen(true);
                } else {
                  setActiveTab("file");
                }
              }}
            >
              <div className="sq-method-icon file-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="sq-method-meta">
                <strong>
                  Upload a file {demoMode && <span className="sq-demo-lock-chip">Sign in</span>}
                </strong>
                <small>PDF, DOCX, PPTX, XLSX, TXT</small>
              </div>
            </button>

            <button
              type="button"
              className={`sq-method-btn ${activeTab === "text" ? "active" : ""}`}
              onClick={() => setActiveTab("text")}
            >
              <div className="sq-method-icon text-icon" aria-hidden="true">
                <span className="sq-t-icon">T</span>
              </div>
              <div className="sq-method-meta">
                <strong>Paste text</strong>
                <small>Notes or a chapter excerpt</small>
              </div>
            </button>

            <button
              type="button"
              className={`sq-method-btn ${activeTab === "topic" ? "active" : ""}`}
              onClick={() => setActiveTab("topic")}
            >
              <div className="sq-method-icon topic-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18h6m-4 4h2M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6v1h8v-1c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" />
                </svg>
              </div>
              <div className="sq-method-meta">
                <strong>Type a topic</strong>
                <small>Quick review from any subject</small>
              </div>
            </button>
          </div>

          {/* Tab 1: File Upload */}
          {activeTab === "file" && (
            <div className="sq-tab-content sq-dropzone-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.odt,.rtf,.csv,.json,.html"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <div className="sq-dropzone" onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}>
                <h4>{isReadingFile ? "Reading document contents..." : uploadedFile ? uploadedFile.name : "Choose a document to extract"}</h4>
                <p>Supports PDF, DOCX, PPTX, XLSX, ODT, RTF, TXT, Markdown</p>
                {uploadedFile && fileMeta && !isReadingFile && (
                  <span className={`sq-file-success ${fileMeta.charCount < 20 ? "warn" : ""}`}>
                    {fileMeta.charCount >= 20
                      ? `✓ Extracted ${fileMeta.charCount.toLocaleString()} characters${
                          fileMeta.pageCount ? ` across ${fileMeta.pageCount} pages` : ""
                        } (${fileMeta.format})`
                      : fileMeta.warning || "No readable text found"}
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
                  onClick={() =>
                    setPastedText(
                      "Photosynthesis: The process by which green plants and certain other organisms transform light energy into chemical energy. Chlorophyll absorbs blue and red light. Light reactions take place in the thylakoid membranes, producing ATP and NADPH. The Calvin cycle occurs in the stroma to fix carbon dioxide into glucose."
                    )
                  }
                >
                  Photosynthesis
                </button>
                <button
                  type="button"
                  className="sq-sample-btn"
                  onClick={() =>
                    setPastedText(
                      "World War II (1939-1945): Global conflict involving the Axis powers (Germany, Italy, Japan) and Allies (US, Britain, USSR, China). Key milestones: Invasion of Poland (1939), Battle of Stalingrad (1942), D-Day Normandy Landings (June 6, 1944), and end of the war in 1945."
                    )
                  }
                >
                  World War II
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
                  placeholder="e.g. Cell Biology, Calculus, World History, JavaScript Basics..."
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                />
              </div>
              <div className="sq-sample-prompts">
                <span>Popular topics:</span>
                {["Cell Biology", "World Geography", "JavaScript Basics", "Ancient Rome", "Chemistry", "Calculus"].map(
                  (t) => (
                    <button
                      key={t}
                      type="button"
                      className="sq-sample-btn"
                      onClick={() => setTopicInput(t)}
                    >
                      {t}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Bottom Actions & Controls */}
          <div className="sq-input-footer">
            <div className="sq-question-count-picker">
              <span>Questions:</span>
              {[5, 10, 15, 20].map((n) => {
                const isLocked = demoMode && n > DEMO_LIMITS.maxQuestionsPerDeck;
                return (
                  <button
                    key={n}
                    type="button"
                    className={`sq-count-pill ${questionCount === n ? "active" : ""} ${isLocked ? "locked" : ""}`}
                    onClick={() => {
                      if (isLocked) {
                        setLoginModalOpen(true);
                      } else {
                        setQuestionCount(n);
                      }
                    }}
                    title={isLocked ? "Sign in to generate larger decks" : `${n} questions`}
                  >
                    {n} Qs{isLocked ? " 🔒" : ""}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="sq-generate-btn"
              onClick={handleGenerate}
              disabled={isGenerating || isReadingFile}
            >
              <span>
                {isGenerating
                  ? "Generating..."
                  : demoMode && demoRemaining === 0
                  ? "Sign In to Generate More"
                  : "Generate Study Questions"}
              </span>
            </button>
          </div>
        </section>

        {/* Ready to Play Banner */}
        {generatedDeck && (
          <section className="sq-ready-banner">
            <div className="sq-ready-content">
              <span className="sq-ready-badge">Active Deck Ready</span>
              <h3>{generatedDeck.title}</h3>
              <p>{generatedDeck.questions.length} questions loaded across Study Café and Bingo Night.</p>
            </div>
            <div className="sq-ready-actions">
              <button
                type="button"
                className="sq-btn-refresh-qs"
                onClick={handleRegenerateFresh}
                disabled={isGenerating}
              >
                ↻ Fresh Questions
              </button>
              <a href="/games/study-cafe" className="sq-btn-play-cafe">
                Play Study Café
              </a>
              <a href="/games/bingo-night" className="sq-btn-play-bingo">
                Play Bingo Night
              </a>
            </div>
          </section>
        )}

        {/* Saved Study Library Section */}
        <section className="sq-library-section">
          <h3>Your Study Library</h3>
          <p>
            {demoMode
              ? "Sign in with Google to save generated decks to your permanent library."
              : "Your saved reviewer decks are ready to play across any game mode."}
          </p>

          <div className="sq-library-grid">
            {demoMode ? (
              <div className="sq-library-empty">
                <h4>Library saving is paused in Demo Mode</h4>
                <p>Sign in with Google to keep unlimited decks, XP, and daily streaks.</p>
                <button
                  type="button"
                  className="sq-generate-btn"
                  style={{ marginTop: "8px" }}
                  onClick={() => setLoginModalOpen(true)}
                >
                  Sign In to Save Library
                </button>
              </div>
            ) : getSavedDecks().length === 0 ? (
              <div className="sq-library-empty">
                <h4>Your library will hold your uploaded sets.</h4>
                <p>Generate your first deck above to see it here.</p>
              </div>
            ) : (
              getSavedDecks().map((deckItem) => (
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
                    <a href="/games/study-cafe" className="sq-deck-play-link">
                      Play →
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <GoogleLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => setLoginModalOpen(false)}
      />
    </div>
  );
}
