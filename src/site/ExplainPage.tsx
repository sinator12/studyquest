import React, { useState, useRef, useEffect } from "react";
import TopNav from "./TopNav";
import GoogleLoginModal from "./GoogleLoginModal";
import { getActiveDeck, setActiveDeck, type DeckInfo } from "./studyStore";
import {
  isDemoMode,
  getDemoUsage,
  incrementDemoUsage,
  DEMO_LIMITS
} from "./authStore";
import {
  extractDocumentDetails,
  explainContentWithAI,
  type ExplainerResult,
  type DocumentExtractionResult,
  type QuestionAnalysis
} from "./aiService";
import "./explain.css";

export default function ExplainPage() {
  const [topicInput, setTopicInput] = useState("");
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedDocText, setAttachedDocText] = useState<string>("");
  const [attachedDocMeta, setAttachedDocMeta] = useState<DocumentExtractionResult | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshingQuiz, setIsRefreshingQuiz] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [liveAnalysis, setLiveAnalysis] = useState<QuestionAnalysis | null>(null);
  const [blockedAnalysis, setBlockedAnalysis] = useState<QuestionAnalysis | null>(null);
  const [result, setResult] = useState<ExplainerResult | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [askedQuestionsHistory, setAskedQuestionsHistory] = useState<string[]>([]);
  const [quizSeed, setQuizSeed] = useState(1);

  const [activeDeck, setActiveDeckState] = useState<DeckInfo>(getActiveDeck());
  const [demoMode, setDemoMode] = useState<boolean>(isDemoMode());
  const [demoUsage, setDemoUsage] = useState(getDemoUsage());
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const syncAuth = () => {
      setDemoMode(isDemoMode());
      setDemoUsage(getDemoUsage());
    };
    const syncDemo = () => setDemoUsage(getDemoUsage());
    window.addEventListener("sq_auth_changed", syncAuth);
    window.addEventListener("sq_demo_updated", syncDemo);
    return () => {
      window.removeEventListener("sq_auth_changed", syncAuth);
      window.removeEventListener("sq_demo_updated", syncDemo);
    };
  }, []);

  const SUGGESTED_TOPICS = [
    "What is osmosis?",
    "Explain supply and demand",
    "How do vaccines work?",
    "What caused World War I?",
    "Explain Newton's three laws",
    "What is a prime number?"
  ];

  const handleSelectSuggested = (t: string) => {
    setAttachedFileName(null);
    setAttachedDocText("");
    setAttachedDocMeta(null);
    setTopicInput(t);
    handleExplain(t, "");
  };

  const handleUseSuggestedQuestion = (q: string) => {
    setTopicInput(q);
    handleExplain(q, attachedDocText);
  };

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setAttachedFileName(file.name);
    setIsReadingFile(true);
    try {
      const details = await extractDocumentDetails(file);
      setAttachedDocMeta(details);
      setAttachedDocText(details.text);
      if (details.warning && details.charCount < 20) {
        setErrorMsg(details.warning);
      } else if (!topicInput.trim()) {
        setTopicInput(`Explain the key concepts and mechanisms inside ${file.name}`);
      }
    } catch {
      setErrorMsg(`Could not read "${file.name}".`);
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleClearFile = () => {
    setAttachedFileName(null);
    setAttachedDocText("");
    setAttachedDocMeta(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFromLibrary = () => {
    if (demoMode) {
      setLoginModalOpen(true);
      return;
    }
    if (activeDeck && activeDeck.questions.length > 0) {
      const deckContent =
        activeDeck.contentPreview ||
        activeDeck.questions.map((q) => `${q.question} Answer: ${q.options[q.correctIndex]}. ${q.explanation || ""}`).join("\n");
      setAttachedFileName(activeDeck.title);
      setAttachedDocText(deckContent);
      setAttachedDocMeta({ text: deckContent, charCount: deckContent.length, format: "DECK" });
      setTopicInput(`Explain the core principles of: ${activeDeck.title}`);
    } else {
      setTopicInput("Explain how cellular respiration produces ATP");
    }
  };

  const handleExplain = async (overrideTopic?: string, overrideDocText?: string, forceExplain: boolean = false) => {
    setErrorMsg(null);
    setBlockedAnalysis(null);
    setLiveAnalysis(null);

    if (demoMode && demoUsage.explainsRun >= DEMO_LIMITS.maxExplains) {
      setLoginModalOpen(true);
      return;
    }

    const docBody = overrideDocText !== undefined ? overrideDocText : attachedDocText;
    const query = (overrideTopic !== undefined ? overrideTopic : topicInput).trim();

    if (!query && !docBody.trim()) {
      setErrorMsg("Enter a question, topic, or attach a readable document to explain.");
      return;
    }

    if (attachedFileName && docBody.trim().length < 20 && overrideDocText === undefined) {
      setErrorMsg(
        attachedDocMeta?.warning ||
          `No readable text was found inside "${attachedFileName}". Paste your notes or upload a text-based PDF/DOCX/PPTX.`
      );
      return;
    }

    setIsGenerating(true);
    setGeneratingStatus("Thinking & analyzing if your question is helpful...");
    setSelectedAnswers({});

    try {
      const parsed = await explainContentWithAI(query, docBody, {
        fileName: attachedFileName || undefined,
        seed: quizSeed,
        forceExplain,
        onProgress: (stage) => setGeneratingStatus(stage),
        onAnalysis: (analysis) => setLiveAnalysis(analysis)
      });

      if (parsed.blockedByAnalysis && parsed.analysis) {
        setBlockedAnalysis(parsed.analysis);
        setResult(null);
        return;
      }

      setResult(parsed);
      setAskedQuestionsHistory(parsed.questions.map((q) => q.question));

      if (demoMode) {
        setDemoUsage(incrementDemoUsage("explainsRun"));
      }

      if (parsed.questions && parsed.questions.length > 0) {
        const newDeck: DeckInfo = {
          id: "deck-" + Date.now(),
          title: `${parsed.topic} Explained`,
          sourceType: docBody.trim().length >= 30 ? "file" : "topic",
          fileName: attachedFileName || undefined,
          contentPreview: docBody.trim().length >= 30 ? docBody.slice(0, 6000) : parsed.summary,
          createdAt: Date.now(),
          questionCount: parsed.questions.length,
          questions: parsed.questions.map((q, i) => ({
            id: 2000 + i,
            subject: "general",
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation
          }))
        };
        setActiveDeck(newDeck);
        setActiveDeckState(newDeck);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Could not generate an explanation. Please try again.");
    } finally {
      setIsGenerating(false);
      setGeneratingStatus("");
    }
  };

  const handleRegenerateQuestions = async () => {
    if (!result) return;
    setIsRefreshingQuiz(true);
    const nextSeed = quizSeed + 1;
    setQuizSeed(nextSeed);
    setSelectedAnswers({});

    try {
      const docBody = attachedDocText.trim().length >= 30
        ? attachedDocText
        : `${result.topic}. ${result.summary} ${result.keyPoints.map((k) => `${k.title}: ${k.explanation}`).join(" ")}`;
      const refreshed = await explainContentWithAI(topicInput || result.topic, docBody, {
        fileName: attachedFileName || undefined,
        seed: nextSeed,
        excludeQuestions: askedQuestionsHistory,
        skipQuestionCheck: true
      });

      if (refreshed.questions && refreshed.questions.length > 0) {
        setResult((prev) => (prev ? { ...prev, questions: refreshed.questions } : refreshed));
        setAskedQuestionsHistory((prev) => [...prev, ...refreshed.questions.map((q) => q.question)].slice(-30));
      }
    } finally {
      setIsRefreshingQuiz(false);
    }
  };

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx
    }));
  };

  const demoLeft = Math.max(0, DEMO_LIMITS.maxExplains - demoUsage.explainsRun);

  return (
    <div className="sq-explain-body">
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        accept=".txt,.md,.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.odt,.rtf,.csv,.json,.html"
        onChange={handleAttachFile}
      />

      <TopNav activeTab="explain" />

      <main className="sq-ex-main">
        {/* Top Badge */}
        <div className="sq-ex-badge-row">
          <div className="sq-ex-badge-pill">
            <span>New: EduQuest Explain</span>
            <span className="sq-ex-badge-beta">BETA</span>
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="sq-ex-title">
          Understand <span className="sq-ex-title-gradient">anything</span>
        </h1>
        <p className="sq-ex-sub">
          Ask a question or attach a full document (PDF, Word, PowerPoint, Excel, or text). EduQuest
          reads inside the document and builds a breakdown with non-repeating check questions.
        </p>

        {/* Main Explainer Input Box */}
        <div className="sq-ex-input-box">
          {attachedFileName && (
            <div className={`sq-ex-file-chip ${attachedDocMeta && attachedDocMeta.charCount < 20 ? "warn" : ""}`}>
              <span>
                {isReadingFile
                  ? `Reading ${attachedFileName}...`
                  : attachedDocMeta && attachedDocMeta.charCount >= 20
                  ? `${attachedFileName} · ${attachedDocMeta.charCount.toLocaleString()} chars read${
                      attachedDocMeta.pageCount ? ` (${attachedDocMeta.pageCount} pages)` : ""
                    }`
                  : `${attachedFileName} · unreadable`}
              </span>
              <button
                type="button"
                className="sq-ex-file-remove"
                onClick={handleClearFile}
                aria-label="Remove attached document"
              >
                ×
              </button>
            </div>
          )}

          <textarea
            className="sq-ex-textarea"
            rows={3}
            placeholder="Ask a question or summarize what you want explained from your attached file..."
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleExplain();
              }
            }}
          />

          <div className="sq-ex-box-bottom">
            <div className="sq-ex-box-tools">
              <button
                type="button"
                className={`sq-ex-tool-btn ${demoMode ? "locked" : ""}`}
                onClick={() => {
                  if (demoMode) {
                    setLoginModalOpen(true);
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                title={demoMode ? "Sign in to upload documents" : "Attach PDF, DOCX, PPTX, XLSX, or TXT"}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                <span>{demoMode ? "Attach Doc (Sign in)" : attachedFileName ? "Replace Doc" : "Attach Doc"}</span>
              </button>

              <button
                type="button"
                className={`sq-ex-tool-btn ${demoMode ? "locked" : ""}`}
                onClick={handleFromLibrary}
                title="Use material from your active deck"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span>{demoMode ? "Library (Sign in)" : "From library"}</span>
              </button>
            </div>

            <button
              type="button"
              className="sq-ex-submit-btn"
              onClick={() => handleExplain()}
              disabled={isGenerating || isReadingFile}
            >
              <span>
                {isGenerating
                  ? "Explaining..."
                  : demoMode && demoLeft === 0
                  ? "Sign In for More"
                  : "Explain"}
              </span>
            </button>
          </div>
        </div>

        <div className="sq-ex-free-indicator">
          <span>
            {demoMode
              ? `Demo Preview: ${demoLeft} of ${DEMO_LIMITS.maxExplains} explanations remaining`
              : "Reads PDF, DOCX, PPTX, XLSX, and notes directly"}
          </span>
        </div>

        {errorMsg && (
          <div className="sq-ex-error-banner" role="alert">
            {errorMsg}
          </div>
        )}

        {/* Suggested Prompt Pills */}
        <div className="sq-ex-prompts-container">
          <div className="sq-ex-prompts-row">
            {SUGGESTED_TOPICS.map((topic, i) => (
              <button
                key={i}
                type="button"
                className="sq-ex-pill-btn"
                onClick={() => handleSelectSuggested(topic)}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Generating Indicator */}
        {isGenerating && (
          <div className="sq-ex-generating-card" role="status" aria-live="polite">
            <div className="sq-ex-loader" aria-hidden="true">
              <div className="sq-ex-loader-halo" />
              <svg className="sq-ex-loader-svg" viewBox="0 0 56 56" fill="none">
                <circle
                  className="sq-ex-loader-track"
                  cx="28"
                  cy="28"
                  r="22"
                  strokeWidth="3"
                />
                <circle
                  className="sq-ex-loader-arc"
                  cx="28"
                  cy="28"
                  r="22"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <div className="sq-ex-loader-core" />
            </div>

            <h3>{liveAnalysis ? "Building your explanation & quiz..." : "Thinking about your question..."}</h3>
            <small className="sq-ex-gen-status">{generatingStatus}</small>

            <div className="sq-ex-stage-track" aria-hidden="true">
              <div className={`sq-ex-stage-step ${liveAnalysis ? "done" : "active"}`}>
                <span className="sq-ex-stage-dot" />
                <span>1. Analyze question</span>
              </div>
              <div className="sq-ex-stage-connector" />
              <div className={`sq-ex-stage-step ${liveAnalysis ? "active" : ""}`}>
                <span className="sq-ex-stage-dot" />
                <span>2. Generate quiz</span>
              </div>
            </div>

            <div className="sq-ex-shimmer-rail" aria-hidden="true">
              <div className="sq-ex-shimmer-bar" />
            </div>

            {liveAnalysis && (
              <div className={`sq-ex-live-thinking verdict-${liveAnalysis.verdict}`}>
                <div className="sq-ex-analysis-meta">
                  <span className={`sq-ex-verdict-pill verdict-${liveAnalysis.verdict}`}>
                    {liveAnalysis.verdict === "helpful"
                      ? `Helpful Question · ${liveAnalysis.helpfulnessScore}/10`
                      : liveAnalysis.verdict === "needs_clarity"
                      ? `Clarified Focus · ${liveAnalysis.helpfulnessScore}/10`
                      : `Needs Improvement · ${liveAnalysis.helpfulnessScore}/10`}
                  </span>
                </div>
                <p>{liveAnalysis.thinking}</p>
              </div>
            )}
          </div>
        )}

        {/* Question Needs Refinement Card (paused before generating questions) */}
        {blockedAnalysis && !isGenerating && (
          <div className="sq-ex-card sq-ex-analysis-gate-card" role="region" aria-label="Question analysis">
            <div className="sq-ex-analysis-meta">
              <span className="sq-ex-verdict-pill verdict-not_helpful">
                Question Check · {blockedAnalysis.helpfulnessScore}/10
              </span>
              <span className="sq-ex-analysis-label">Analyzed before generating questions</span>
            </div>
            <h3>Let&apos;s make this question more helpful first</h3>
            <p className="sq-ex-analysis-thinking">{blockedAnalysis.thinking}</p>

            {blockedAnalysis.refinedQuestion && (
              <div className="sq-ex-refined-box">
                <span className="sq-ex-refined-label">Suggested stronger question:</span>
                <button
                  type="button"
                  className="sq-ex-refined-btn"
                  onClick={() => handleUseSuggestedQuestion(blockedAnalysis.refinedQuestion!)}
                >
                  Use &amp; Explain: &ldquo;{blockedAnalysis.refinedQuestion}&rdquo; →
                </button>
              </div>
            )}

            {blockedAnalysis.suggestions && blockedAnalysis.suggestions.length > 0 && (
              <div className="sq-ex-alt-suggestions">
                <span className="sq-ex-refined-label">Or try one of these helpful study questions:</span>
                <div className="sq-ex-alt-pills">
                  {blockedAnalysis.suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="sq-ex-pill-btn"
                      onClick={() => handleUseSuggestedQuestion(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="sq-ex-gate-actions">
              <button
                type="button"
                className="sq-ex-force-btn"
                onClick={() => handleExplain(undefined, undefined, true)}
              >
                Generate Questions Anyway
              </button>
            </div>
          </div>
        )}

        {/* Result Card */}
        {result && !isGenerating && (
          <div className="sq-ex-result-section">
            <div className="sq-ex-card sq-ex-player-card">
              {result.analysis && (
                <div className={`sq-ex-analysis-banner verdict-${result.analysis.verdict}`}>
                  <div className="sq-ex-analysis-meta">
                    <span className={`sq-ex-verdict-pill verdict-${result.analysis.verdict}`}>
                      {result.analysis.verdict === "helpful"
                        ? `Question Check: Helpful · ${result.analysis.helpfulnessScore}/10`
                        : result.analysis.verdict === "needs_clarity"
                        ? `Question Check: Clarified · ${result.analysis.helpfulnessScore}/10`
                        : `Question Check: Forced · ${result.analysis.helpfulnessScore}/10`}
                    </span>
                    <span className="sq-ex-analysis-label">AI Pre-Generation Thinking</span>
                  </div>
                  <p className="sq-ex-analysis-thinking">{result.analysis.thinking}</p>
                  {result.analysis.refinedQuestion && result.analysis.verdict !== "helpful" && (
                    <p className="sq-ex-analysis-focus">
                      <strong>Focused angle:</strong> {result.analysis.refinedQuestion}
                    </p>
                  )}
                </div>
              )}

              <div className="sq-ex-player-head">
                <span className="sq-ex-player-tag">Document &amp; Concept Breakdown</span>
                <h2>{result.topic}</h2>
                <p className="sq-ex-summary-text">{result.summary}</p>
              </div>

              <div className="sq-ex-steps-grid">
                {result.keyPoints.map((pt, idx) => (
                  <div key={idx} className="sq-ex-step-item">
                    <div className="sq-ex-step-num-box">{idx + 1}</div>
                    <div className="sq-ex-step-text">
                      <h4>{pt.title}</h4>
                      <p>{pt.explanation}</p>
                      {pt.analogy && (
                        <div className="sq-ex-analogy-box">
                          <strong>Key Takeaway:</strong> {pt.analogy}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {result.funFact && (
                <div className="sq-ex-fun-fact">
                  <span>
                    <strong>Highlight:</strong> {result.funFact}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Check Quiz with Non-Repeating Regenerator */}
            <div className="sq-ex-card sq-ex-quiz-card">
              <div className="sq-ex-quiz-head">
                <div>
                  <span className="sq-ex-quiz-badge">Quick Check Quiz</span>
                  <h3>Test what you just read</h3>
                </div>
                <button
                  type="button"
                  className="sq-ex-regen-quiz-btn"
                  onClick={handleRegenerateQuestions}
                  disabled={isRefreshingQuiz}
                >
                  {isRefreshingQuiz ? "Generating..." : "↻ Generate New Questions"}
                </button>
              </div>

              <div className="sq-ex-questions-list">
                {result.questions.map((q, qIdx) => {
                  const userChoice = selectedAnswers[qIdx];
                  const hasAnswered = typeof userChoice === "number";

                  return (
                    <div key={`${quizSeed}-${qIdx}`} className="sq-ex-q-item">
                      <p className="sq-ex-q-text">
                        <strong>Q{qIdx + 1}:</strong> {q.question}
                      </p>

                      <div className="sq-ex-options-grid">
                        {q.options.map((opt, optIdx) => {
                          let optClass = "sq-ex-opt-btn";
                          if (hasAnswered) {
                            if (optIdx === q.correctIndex) {
                              optClass += " correct";
                            } else if (optIdx === userChoice) {
                              optClass += " wrong";
                            } else {
                              optClass += " disabled";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              className={optClass}
                              onClick={() => !hasAnswered && handleSelectOption(qIdx, optIdx)}
                              disabled={hasAnswered}
                            >
                              <span className="sq-ex-opt-letter">{["A", "B", "C", "D"][optIdx]}</span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {hasAnswered && (
                        <div className={`sq-ex-ans-feedback ${userChoice === q.correctIndex ? "success" : "retry"}`}>
                          <span>
                            {userChoice === q.correctIndex ? "✓ Correct — " : "✕ Incorrect — "}
                            {q.explanation}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="sq-ex-quiz-actions">
                <a href="/games/study-cafe" className="sq-ex-play-btn sq-btn-cafe">
                  Play in Study Café →
                </a>
                <a href="/games/bingo-night" className="sq-ex-play-btn sq-btn-bingo">
                  Play in Bingo Night →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <section className="sq-ex-how-it-works">
          <div className="sq-ex-divider">
            <span>How it works</span>
          </div>

          <div className="sq-ex-features-grid">
            <div className="sq-ex-feature-card">
              <div className="sq-ex-feat-icon sq-feat-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <h4>1. Reads inside documents</h4>
              <p>Parses actual pages, slides, and paragraphs from PDF, DOCX, PPTX, XLSX, and plain text.</p>
            </div>
            <div className="sq-ex-feature-card">
              <div className="sq-ex-feat-icon sq-feat-cyan">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                </svg>
              </div>
              <h4>2. Structured explanation</h4>
              <p>Breaks complex sections into clear steps, plain-English summaries, and key takeaways.</p>
            </div>
            <div className="sq-ex-feature-card">
              <div className="sq-ex-feat-icon sq-feat-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h4>3. Fresh retention quiz</h4>
              <p>Generates new non-repeating questions on demand and sends them straight to your games.</p>
            </div>
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
