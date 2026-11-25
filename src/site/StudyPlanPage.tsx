import React, { useState, useEffect, useRef } from "react";
import TopNav from "./TopNav";
import GoogleLoginModal from "./GoogleLoginModal";
import { isDemoMode } from "./authStore";
import {
  setActiveDeck,
  getAIConfig,
  DEFAULT_GROQ_KEY,
  recordActivityToday,
  type DeckInfo
} from "./studyStore";
import {
  extractDocumentDetails,
  generateStudyPlanWithGroq,
  generateQuestionsFromContent,
  type DocumentExtractionResult
} from "./aiService";
import "./studyPlan.css";

interface StudyPlan {
  id: string;
  examName: string;
  examDate: string;
  daysRemaining: number;
  materialName: string;
  language: string;
  sessions: {
    day: number;
    title: string;
    description: string;
    game: string;
    gameUrl: string;
    done: boolean;
  }[];
  createdAt: string;
}

const STORAGE_KEY = "sq_study_plan_active";

export default function StudyPlanPage() {
  const [step, setStep] = useState<number>(1);
  const [demoMode, setDemoMode] = useState<boolean>(isDemoMode());
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [examName, setExamName] = useState("Biology Midterm");
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [materialTab, setMaterialTab] = useState<"upload" | "notes">("notes");
  const [materialNotes, setMaterialNotes] = useState(
    "Key concepts: Cell division, Mitosis, Meiosis, DNA replication, Photosynthesis"
  );
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [docMeta, setDocMeta] = useState<DocumentExtractionResult | null>(null);
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [addedUrls, setAddedUrls] = useState<string[]>([]);
  const [language, setLanguage] = useState("English");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [generatingStatus, setGeneratingStatus] = useState("Analyzing your study material...");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const syncAuth = () => setDemoMode(isDemoMode());
    window.addEventListener("sq_auth_changed", syncAuth);

    try {
      if (!isDemoMode()) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setActivePlan(JSON.parse(saved));
          setStep(4);
        }
      }
    } catch {
      // ignore
    }

    return () => window.removeEventListener("sq_auth_changed", syncAuth);
  }, []);

  const handleDocFile = async (file: File) => {
    if (!file) return;
    setErrorMsg(null);
    setIsParsingDoc(true);
    setUploadedDocName(file.name);
    try {
      const details = await extractDocumentDetails(file);
      setDocMeta(details);
      if (details.text && details.text.trim().length > 0) {
        setMaterialNotes((prev) =>
          prev && !prev.startsWith("Key concepts: Cell division")
            ? `${prev}\n\n${details.text}`
            : details.text
        );
      } else if (details.warning) {
        setErrorMsg(details.warning);
      }
    } catch {
      setErrorMsg(`Could not parse "${file.name}".`);
    } finally {
      setIsParsingDoc(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleDocFile(file);
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    setAddedUrls((prev) => [...prev, urlInput.trim()]);
    setMaterialNotes((prev) => `${prev}\nReference URL: ${urlInput.trim()}`);
    setUrlInput("");
  };

  const handleGeneratePlan = async () => {
    if (demoMode) {
      setLoginModalOpen(true);
      return;
    }

    setErrorMsg(null);
    setStep(3);
    setGeneratingStatus("Reading your notes and scheduling exam milestones...");

    const targetDate = new Date(examDate);
    const today = new Date();
    const diffTime = Math.max(0, targetDate.getTime() - today.getTime());
    const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const aiConfig = getAIConfig();
    const groqKey = aiConfig.groqKey || DEFAULT_GROQ_KEY;

    try {
      const planResult = await generateStudyPlanWithGroq(
        examName,
        examDate,
        materialNotes,
        groqKey
      );

      setGeneratingStatus("Creating fresh active-recall quiz questions for your plan...");
      try {
        const deckResult = await generateQuestionsFromContent(
          materialNotes,
          uploadedDocName ? "file" : "text",
          {
            count: 8,
            seed: Date.now()
          }
        );

        if (deckResult && deckResult.questions.length > 0) {
          const newDeck: DeckInfo = {
            id: "deck-" + Date.now(),
            title: deckResult.title || `${examName} Review`,
            sourceType: uploadedDocName ? "file" : "text",
            fileName: uploadedDocName || undefined,
            contentPreview: materialNotes.slice(0, 6000),
            createdAt: Date.now(),
            questionCount: deckResult.questions.length,
            questions: deckResult.questions
          };
          setActiveDeck(newDeck);
        }
      } catch (deckErr) {
        console.warn("Deck question generation warning:", deckErr);
      }

      const newPlan: StudyPlan = {
        id: "plan-" + Date.now(),
        examName: examName.trim() || "Upcoming Exam",
        examDate,
        daysRemaining,
        materialName: uploadedDocName || examName,
        language,
        createdAt: new Date().toISOString(),
        sessions: planResult.sessions
      };

      setActivePlan(newPlan);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlan));
      setStep(4);
    } catch (err) {
      console.error("Plan creation error:", err);
      setErrorMsg("Could not build study plan. Please review your inputs and try again.");
      setStep(2);
    }
  };

  const handleToggleSession = (index: number) => {
    if (!activePlan) return;
    const updated = { ...activePlan, sessions: activePlan.sessions.map((s, i) => (i === index ? { ...s, done: !s.done } : s)) };
    setActivePlan(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (updated.sessions[index].done) {
      recordActivityToday(`Completed Study Plan: ${updated.sessions[index].title}`, 30);
    }
  };

  const handleDeletePlan = () => {
    setActivePlan(null);
    localStorage.removeItem(STORAGE_KEY);
    setStep(1);
  };

  return (
    <div className="sq-study-plan-body">
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        accept=".txt,.md,.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.odt,.rtf,.csv,.json,.html"
        onChange={handleFileInputChange}
      />

      <TopNav activeTab="study-plan" />

      <main className="sq-sp-main-container">
        {/* Hero Section */}
        <div className="sq-sp-hero-row">
          <div className="sq-sp-mascot-wrap" aria-hidden="true">
            <span className="sq-sp-sparkle sq-sp-sp1">✦</span>
            <span className="sq-sp-sparkle sq-sp-sp2">✦</span>
            <span className="sq-sp-sparkle sq-sp-sp3">✦</span>

            <svg viewBox="0 0 160 160" width="150" height="150" fill="none">
              <g className="sq-sp-mascot-brain">
                <ellipse cx="66" cy="38" rx="20" ry="17" fill="#FBBF24" />
                <ellipse cx="94" cy="38" rx="20" ry="17" fill="#FBBF24" />
                <ellipse cx="80" cy="40" rx="14" ry="13" fill="#F59E0B" />
                <path d="M57 36C59 30 70 28 74 34C76 38 68 44 63 42" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M103 36C101 30 90 28 86 34C84 38 92 44 97 42" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="80" y1="26" x2="80" y2="48" stroke="#D97706" strokeWidth="2.5" />
              </g>
              <rect x="58" y="118" width="8" height="18" rx="4" fill="#6D28D9" />
              <rect x="94" y="118" width="8" height="18" rx="4" fill="#6D28D9" />
              <ellipse cx="60" cy="138" rx="12" ry="6" fill="#5B21B6" />
              <ellipse cx="102" cy="138" rx="12" ry="6" fill="#5B21B6" />
              <path
                d="M44 68C32 68 24 78 24 92C24 108 36 122 52 122C62 122 70 114 80 114C90 114 98 122 108 122C124 122 136 108 136 92C136 78 128 68 116 68H44Z"
                fill="#7C3AED"
              />
              <path d="M26 84C18 88 16 98 22 104" stroke="#6D28D9" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M134 82C142 74 146 62 138 52" stroke="#6D28D9" strokeWidth="6" strokeLinecap="round" fill="none" />
              <circle cx="138" cy="52" r="5" fill="#7C3AED" />
              <circle cx="80" cy="90" r="15" fill="#FBBF24" />
              <ellipse cx="75.5" cy="88" rx="2.2" ry="2.8" fill="#1E1B4B" />
              <ellipse cx="84.5" cy="88" rx="2.2" ry="2.8" fill="#1E1B4B" />
              <circle cx="76.2" cy="87" r="0.8" fill="#FFFFFF" />
              <circle cx="85.2" cy="87" r="0.8" fill="#FFFFFF" />
              <path d="M76 93C77.5 95.5 82.5 95.5 84 93" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />
              <ellipse cx="73" cy="92" rx="1.8" ry="1.2" fill="#F87171" opacity="0.8" />
              <ellipse cx="87" cy="92" rx="1.8" ry="1.2" fill="#F87171" opacity="0.8" />
              <rect x="42" y="86" width="9" height="3.5" rx="1.7" fill="#C4B5FD" />
              <rect x="45" y="83" width="3.5" height="9" rx="1.7" fill="#C4B5FD" />
              <circle cx="114" cy="86" r="2.2" fill="#C4B5FD" />
              <circle cx="120" cy="90" r="2.2" fill="#C4B5FD" />
            </svg>
          </div>

          <div className="sq-sp-speech-bubble">
            <h1 className="sq-sp-speech-heading">
              {step === 1 && "What exam are you studying for?"}
              {step === 2 && "Add your study material"}
              {step === 3 && "Building your study plan..."}
              {step === 4 && "Your study plan is ready"}
            </h1>
            <p className="sq-sp-speech-desc">
              {step === 1 && "Set your subject title and target exam date so EduQuest can space out your review."}
              {step === 2 && "Upload documents (PDF, DOCX, PPTX, XLSX), add URLs, or paste your notes."}
              {step === 3 && "Analyzing your material and crafting study milestones with matching games."}
              {step === 4 && "Work through each session and check off milestones as you master them."}
            </p>
          </div>
        </div>

        {/* Mobile-Safe 4-Step Stepper Bar (Fixes Mobile Clipping & Oval Circles) */}
        <nav className="sq-sp-stepper-bar" aria-label="Study plan steps">
          <button
            type="button"
            className={`sq-sp-step-node ${step > 1 ? "completed" : step === 1 ? "active" : ""}`}
            onClick={() => setStep(1)}
          >
            <span className={`sq-sp-step-circle ${step > 1 ? "sq-sp-step-green" : "sq-sp-step-orange"}`}>
              {step > 1 ? "✓" : "1"}
            </span>
            <span className={`sq-sp-step-name ${step === 1 ? "active-text" : ""}`}>Subject &amp; Date</span>
          </button>

          <div className={`sq-sp-step-connector ${step > 1 ? "completed" : "dotted"}`} aria-hidden="true" />

          <button
            type="button"
            className={`sq-sp-step-node ${step === 2 ? "active" : step > 2 ? "completed" : "inactive"}`}
            onClick={() => {
              if (step > 1 || examName.trim()) setStep(2);
            }}
          >
            <span className={`sq-sp-step-circle ${step > 2 ? "sq-sp-step-green" : step === 2 ? "sq-sp-step-orange" : "sq-sp-step-gray"}`}>
              {step > 2 ? "✓" : "2"}
            </span>
            <span className={`sq-sp-step-name ${step === 2 ? "active-text" : ""}`}>Study Material</span>
          </button>

          <div className={`sq-sp-step-connector ${step > 2 ? "completed" : "dotted"}`} aria-hidden="true" />

          <div className={`sq-sp-step-node ${step === 3 ? "active" : step > 3 ? "completed" : "inactive"}`}>
            <span className={`sq-sp-step-circle ${step > 3 ? "sq-sp-step-green" : step === 3 ? "sq-sp-step-orange" : "sq-sp-step-gray"}`}>
              {step > 3 ? "✓" : "3"}
            </span>
            <span className={`sq-sp-step-name ${step === 3 ? "active-text" : ""}`}>Generating</span>
          </div>

          <div className={`sq-sp-step-connector ${step > 3 ? "completed" : "dotted"}`} aria-hidden="true" />

          <button
            type="button"
            className={`sq-sp-step-node ${step === 4 ? "active" : "inactive"}`}
            onClick={() => {
              if (activePlan) setStep(4);
            }}
          >
            <span className={`sq-sp-step-circle ${step === 4 ? "sq-sp-step-orange" : "sq-sp-step-gray"}`}>4</span>
            <span className={`sq-sp-step-name ${step === 4 ? "active-text" : ""}`}>Review</span>
          </button>
        </nav>

        {demoMode && (
          <div className="sq-sp-demo-notice">
            <span>
              <strong>Demo Preview:</strong> You can explore the planner steps, and signing in with Google unlocks generating &amp; saving personalized plans.
            </span>
            <button type="button" className="sq-sp-demo-signin" onClick={() => setLoginModalOpen(true)}>
              Sign In
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="sq-sp-error-banner" role="alert">
            {errorMsg}
          </div>
        )}

        {/* Main Card */}
        <section className="sq-sp-photo-card">
          {step === 1 && (
            <div className="sq-sp-step-body">
              <div className="sq-sp-field-group">
                <label className="sq-sp-field-label" htmlFor="sp-exam-name">Subject or Exam Name</label>
                <input
                  id="sp-exam-name"
                  type="text"
                  className="sq-sp-input"
                  placeholder="e.g. Biology Midterm, Calculus II, World History"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (!examName.trim()) setExamName("Upcoming Exam");
                      setStep(2);
                    }
                  }}
                />
                <div className="sq-sp-quick-subjects">
                  <span>Quick pick:</span>
                  {["Biology", "Calculus", "World History", "Chemistry", "Psychology"].map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      className="sq-sp-subj-pill"
                      onClick={() => setExamName(subj + " Exam")}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sq-sp-field-group">
                <label className="sq-sp-field-label" htmlFor="sp-exam-date">Target Exam Date</label>
                <input
                  id="sp-exam-date"
                  type="date"
                  className="sq-sp-input"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
                <small className="sq-sp-field-hint">
                  EduQuest calculates days remaining and schedules your study sessions evenly.
                </small>
              </div>

              <div className="sq-sp-card-bottom-bar">
                <div />
                <button
                  type="button"
                  className="sq-sp-btn-gold"
                  onClick={() => {
                    if (!examName.trim()) setExamName("Upcoming Exam");
                    setStep(2);
                  }}
                >
                  Continue to Study Material →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="sq-sp-step-body">
              <div className="sq-sp-source-toggle-grid">
                <div
                  className={`sq-sp-source-box ${materialTab === "upload" ? "active" : ""}`}
                  onClick={() => {
                    setMaterialTab("upload");
                    fileInputRef.current?.click();
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="sq-sp-source-badge sq-badge-purple" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="sq-sp-source-texts">
                    <strong className="sq-sp-source-title">Upload files</strong>
                    <span className="sq-sp-source-sub">
                      {isParsingDoc
                        ? "Reading file contents..."
                        : uploadedDocName && docMeta && docMeta.charCount >= 20
                        ? `${uploadedDocName} (${docMeta.charCount.toLocaleString()} chars)`
                        : "PDF, DOCX, PPTX, XLSX, TXT"}
                    </span>
                  </div>
                </div>

                <div
                  className={`sq-sp-source-box ${materialTab === "notes" ? "active" : ""}`}
                  onClick={() => setMaterialTab("notes")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="sq-sp-source-badge sq-badge-cyan" aria-hidden="true">
                    <span>T</span>
                  </div>
                  <div className="sq-sp-source-texts">
                    <strong className="sq-sp-source-title">Write notes</strong>
                    <span className="sq-sp-source-sub">Or paste study guide text</span>
                  </div>
                </div>
              </div>

              <div className="sq-sp-field-group">
                <label className="sq-sp-field-label" htmlFor="sp-notes-area">Your Notes</label>
                <textarea
                  id="sp-notes-area"
                  className="sq-sp-textarea"
                  rows={6}
                  placeholder="Describe what you need to learn, paste notes, or upload a document above..."
                  value={materialNotes}
                  onChange={(e) => setMaterialNotes(e.target.value)}
                />
              </div>

              <div className="sq-sp-field-group">
                <div className="sq-sp-url-row">
                  <input
                    type="text"
                    className="sq-sp-url-input"
                    placeholder="Paste a reference URL (optional)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
                  />
                  <button type="button" className="sq-sp-url-add-btn" onClick={handleAddUrl}>
                    Add
                  </button>
                </div>
                {addedUrls.length > 0 && (
                  <div className="sq-sp-added-tags">
                    {addedUrls.map((u, i) => (
                      <span key={i} className="sq-sp-url-tag">{u}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="sq-sp-field-group">
                <label className="sq-sp-field-label" htmlFor="sp-language">Plan Language</label>
                <div className="sq-sp-select-wrap">
                  <select
                    id="sp-language"
                    className="sq-sp-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Tagalog">Tagalog</option>
                  </select>
                </div>
                <small className="sq-sp-field-hint">
                  Your plan, sessions and questions will be written in this language.
                </small>
              </div>

              <div className="sq-sp-card-bottom-bar">
                <button type="button" className="sq-sp-btn-back" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="sq-sp-btn-gold"
                  onClick={handleGeneratePlan}
                  disabled={isParsingDoc}
                >
                  {demoMode ? "Sign In to Generate Plan" : "Generate Study Plan"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="sq-sp-generating-view">
              <div className="sq-sp-spinner-large" />
              <h3>Building Your Personalized Study Plan</h3>
              <p className="sq-sp-gen-live-status">{generatingStatus}</p>
            </div>
          )}

          {step === 4 && activePlan && (
            <div className="sq-sp-review-view">
              <div className="sq-sp-review-head">
                <div>
                  <span className="sq-sp-review-badge">Plan Ready</span>
                  <h2>{activePlan.examName}</h2>
                  <p>
                    Target Date: <strong>{activePlan.examDate}</strong> ({activePlan.daysRemaining} days remaining)
                  </p>
                </div>
                <button type="button" className="sq-sp-reset-link" onClick={handleDeletePlan}>
                  Create Another Plan
                </button>
              </div>

              <div className="sq-sp-sessions-grid">
                {activePlan.sessions.map((sess, idx) => (
                  <div key={idx} className={`sq-sp-session-card ${sess.done ? "done" : ""}`}>
                    <label className="sq-sp-check-label">
                      <input
                        type="checkbox"
                        checked={sess.done}
                        onChange={() => handleToggleSession(idx)}
                      />
                      <span className="sq-sp-custom-check" />
                    </label>
                    <div className="sq-sp-sess-content">
                      <div className="sq-sp-sess-top">
                        <span className="sq-sp-sess-day">Day {sess.day}</span>
                        <h4 className="sq-sp-sess-title">{sess.title}</h4>
                      </div>
                      <p className="sq-sp-sess-desc">{sess.description}</p>
                    </div>
                    <a
                      href={sess.gameUrl?.includes("bingo") ? "/games/bingo-night" : "/games/study-cafe"}
                      className="sq-sp-sess-play-btn"
                    >
                      Play {sess.game?.toLowerCase().includes("bingo") ? "Bingo Night" : "Study Café"} →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
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
