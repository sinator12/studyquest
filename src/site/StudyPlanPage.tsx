import React, { useState, useEffect, useRef } from "react";
import TopNav from "./TopNav";
import { getActiveDeck, setActiveDeck, getAIConfig, DEFAULT_GROQ_KEY, recordActivityToday, type DeckInfo } from "./studyStore";
import { extractTextFromFile, generateStudyPlanWithGroq, generateWithGroq } from "./aiService";
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
  // Wizard steps: 1 = Subject & Date, 2 = Study Material, 3 = Generating, 4 = Review
  const [step, setStep] = useState<number>(1);

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
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [addedUrls, setAddedUrls] = useState<string[]>([]);
  const [language, setLanguage] = useState("English");

  const [generatingStatus, setGeneratingStatus] = useState("Analyzing your study material with Groq AI...");


  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved plan
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setActivePlan(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Handle uploading any document
  const handleDocFile = async (file: File) => {
    if (!file) return;
    setIsParsingDoc(true);
    setUploadedDocName(file.name);
    try {
      const extracted = await extractTextFromFile(file);
      if (extracted && extracted.trim().length > 0) {
        setMaterialNotes((prev) => (prev ? prev + "\n\n" + extracted : extracted));
      }
    } catch (err) {
      console.warn("Could not parse file:", err);
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
    setMaterialNotes((prev) => prev + `\nReference URL: ${urlInput.trim()}`);
    setUrlInput("");
  };

  const handleGeneratePlan = async () => {
    setStep(3); // Go to generating step
    setGeneratingStatus("Groq AI: Connecting to ultra-fast model (openai/gpt-oss-120b)...");

    const targetDate = new Date(examDate);
    const today = new Date();
    const diffTime = Math.max(0, targetDate.getTime() - today.getTime());
    const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const aiConfig = getAIConfig();
    const groqKey = aiConfig.groqKey || DEFAULT_GROQ_KEY;

    try {
      setGeneratingStatus("Groq AI: Analyzing notes & creating personalized 3-day milestones...");
      const planResult = await generateStudyPlanWithGroq(
        examName,
        examDate,
        materialNotes,
        groqKey
      );

      setGeneratingStatus("Groq AI: Generating interactive quiz questions for your games...");
      try {
        const deckResult = await generateWithGroq(
          materialNotes,
          uploadedDocName ? "file" : "text",
          8,
          groqKey
        );

        if (deckResult && deckResult.questions.length > 0) {
          const newDeck: DeckInfo = {
            id: "deck-" + Date.now(),
            title: deckResult.title || `${examName} Review`,
            sourceType: uploadedDocName ? "file" : "text",
            fileName: uploadedDocName || undefined,
            contentPreview: materialNotes.slice(0, 200),
            createdAt: new Date().toISOString(),
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
      setStep(4); // Go to review step
    } catch (err) {
      console.error("Plan creation error:", err);
      setStep(2);
    }
  };

  const handleToggleSession = (index: number) => {
    if (!activePlan) return;
    const updated = { ...activePlan };
    const nextState = !updated.sessions[index].done;
    updated.sessions[index].done = nextState;
    setActivePlan(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (nextState) {
      recordActivityToday(`Completed Study Plan: ${updated.sessions[index].title}`, 30);
    }
  };

  const handleDeletePlan = () => {
    setActivePlan(null);
    localStorage.removeItem(STORAGE_KEY);
    setStep(2);
  };

  return (
    <div className="sq-study-plan-body">
      {/* Hidden file input supporting ANY document type */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        accept="*/*"
        onChange={handleFileInputChange}
      />

      {/* Navigation Header */}
      <TopNav activeTab="study-plan" />

      <main className="sq-sp-main-container">
        {/* ========================================================
            HERO SECTION: Mascot on Left + Speech Bubble on Right
            (Exact reproduction of photo)
           ======================================================== */}
        <div className="sq-sp-hero-row">
          {/* Mascot with Brain, Feet, and Waving Hand */}
          <div className="sq-sp-mascot-wrap">
            {/* Speed & Sparkle Accents */}
            <span className="sq-sp-sparkle sq-sp-sp1">✦</span>
            <span className="sq-sp-sparkle sq-sp-sp2">✦</span>
            <span className="sq-sp-sparkle sq-sp-sp3">✦</span>

            <svg viewBox="0 0 160 160" width="150" height="150" fill="none">
              {/* Golden Brain Lobes */}
              <g className="sq-sp-mascot-brain">
                <ellipse cx="66" cy="38" rx="20" ry="17" fill="#FBBF24" />
                <ellipse cx="94" cy="38" rx="20" ry="17" fill="#FBBF24" />
                <ellipse cx="80" cy="40" rx="14" ry="13" fill="#F59E0B" />
                <path d="M57 36C59 30 70 28 74 34C76 38 68 44 63 42" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M103 36C101 30 90 28 86 34C84 38 92 44 97 42" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="80" y1="26" x2="80" y2="48" stroke="#D97706" strokeWidth="2.5" />
              </g>

              {/* Legs and Feet */}
              <rect x="58" y="118" width="8" height="18" rx="4" fill="#6D28D9" />
              <rect x="94" y="118" width="8" height="18" rx="4" fill="#6D28D9" />
              <ellipse cx="60" cy="138" rx="12" ry="6" fill="#5B21B6" />
              <ellipse cx="102" cy="138" rx="12" ry="6" fill="#5B21B6" />

              {/* Gamepad Controller Body */}
              <path
                d="M44 68C32 68 24 78 24 92C24 108 36 122 52 122C62 122 70 114 80 114C90 114 98 122 108 122C124 122 136 108 136 92C136 78 128 68 116 68H44Z"
                fill="#7C3AED"
              />

              {/* Left Arm (down/resting) */}
              <path d="M26 84C18 88 16 98 22 104" stroke="#6D28D9" strokeWidth="6" strokeLinecap="round" fill="none" />

              {/* Right Arm (waving happily upward) */}
              <path d="M134 82C142 74 146 62 138 52" stroke="#6D28D9" strokeWidth="6" strokeLinecap="round" fill="none" />
              <circle cx="138" cy="52" r="5" fill="#7C3AED" />

              {/* Golden Smiling Face Badge */}
              <circle cx="80" cy="90" r="15" fill="#FBBF24" />
              <ellipse cx="75.5" cy="88" rx="2.2" ry="2.8" fill="#1E1B4B" />
              <ellipse cx="84.5" cy="88" rx="2.2" ry="2.8" fill="#1E1B4B" />
              <circle cx="76.2" cy="87" r="0.8" fill="#FFFFFF" />
              <circle cx="85.2" cy="87" r="0.8" fill="#FFFFFF" />
              <path d="M76 93C77.5 95.5 82.5 95.5 84 93" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />
              <ellipse cx="73" cy="92" rx="1.8" ry="1.2" fill="#F87171" opacity="0.8" />
              <ellipse cx="87" cy="92" rx="1.8" ry="1.2" fill="#F87171" opacity="0.8" />

              {/* Controller Details */}
              <rect x="42" y="86" width="9" height="3.5" rx="1.7" fill="#C4B5FD" />
              <rect x="45" y="83" width="3.5" height="9" rx="1.7" fill="#C4B5FD" />
              <circle cx="114" cy="86" r="2.2" fill="#C4B5FD" />
              <circle cx="120" cy="90" r="2.2" fill="#C4B5FD" />
            </svg>
          </div>

          {/* Speech Bubble Card matching Photo */}
          <div className="sq-sp-speech-bubble">
            <h1 className="sq-sp-speech-heading">
              {step === 1 && "What exam are you studying for?"}
              {step === 2 && "Add your study material"}
              {step === 3 && "Groq AI is building your plan..."}
              {step === 4 && "Your personalized study plan is ready!"}
            </h1>
            <p className="sq-sp-speech-desc">
              {step === 1 && "Set your subject title and target exam date so AI can schedule your study milestones."}
              {step === 2 && "Upload documents, add URLs, or write notes. The more material, the better your plan!"}
              {step === 3 && "Hang tight! High-speed Groq AI is analyzing your notes and crafting your study sessions."}
              {step === 4 && "Master your material with daily bite-sized sessions and interactive study games!"}
            </p>
          </div>
        </div>

        {/* ========================================================
            STEPPER BAR (Subject & Date -> Study Material -> Generating -> Review)
            (Exact reproduction of photo)
           ======================================================== */}
        <div className="sq-sp-stepper-bar">
          {/* Step 1: Subject & Date */}
          <div
            className={`sq-sp-step-node ${step > 1 ? "completed" : "active"}`}
            onClick={() => setStep(1)}
          >
            {step > 1 ? (
              <span className="sq-sp-step-circle sq-sp-step-green">✓</span>
            ) : (
              <span className="sq-sp-step-circle sq-sp-step-orange">1</span>
            )}
            <span className={`sq-sp-step-name ${step === 1 ? "active-text" : ""}`}>Subject & Date</span>
          </div>

          {/* Connector 1 -> 2: solid green when step > 1, dotted when step == 1 */}
          <div className={`sq-sp-step-connector ${step > 1 ? "completed" : "dotted"}`} />

          {/* Step 2: Study Material */}
          <div
            className={`sq-sp-step-node ${step === 2 ? "active" : step > 2 ? "completed" : "inactive"}`}
            onClick={() => {
              if (step > 1 || examName.trim()) setStep(2);
            }}
          >
            {step > 2 ? (
              <span className="sq-sp-step-circle sq-sp-step-green">✓</span>
            ) : (
              <span className={`sq-sp-step-circle ${step === 2 ? "sq-sp-step-orange" : "sq-sp-step-gray"}`}>2</span>
            )}
            <span className={`sq-sp-step-name ${step === 2 ? "active-text" : ""}`}>Study Material</span>
          </div>

          {/* Connector 2 -> 3 */}
          <div className={`sq-sp-step-connector ${step > 2 ? "completed" : "dotted"}`} />

          {/* Step 3: Generating */}
          <div className={`sq-sp-step-node ${step === 3 ? "active" : step > 3 ? "completed" : "inactive"}`}>
            <span className={`sq-sp-step-circle ${step === 3 ? "sq-sp-step-orange" : "sq-sp-step-gray"}`}>3</span>
            <span className={`sq-sp-step-name ${step === 3 ? "active-text" : ""}`}>Generating</span>
          </div>

          {/* Connector 3 -> 4 */}
          <div className={`sq-sp-step-connector ${step > 3 ? "completed" : "dotted"}`} />

          {/* Step 4: Review */}
          <div className={`sq-sp-step-node ${step === 4 ? "active" : "inactive"}`}>
            <span className={`sq-sp-step-circle ${step === 4 ? "sq-sp-step-orange" : "sq-sp-step-gray"}`}>4</span>
            <span className={`sq-sp-step-name ${step === 4 ? "active-text" : ""}`}>Review</span>
          </div>
        </div>

        {/* ========================================================
            MAIN ACTION CARD CONTAINER (Matching Photo Exactly)
           ======================================================== */}
        <section className="sq-sp-photo-card">
          {/* ---------------- STEP 1: SUBJECT & DATE ---------------- */}
          {step === 1 && (
            <div className="sq-sp-step-body">
              <div className="sq-sp-field-group">
                <label className="sq-sp-field-label">Subject or Exam Name</label>
                <input
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
                <label className="sq-sp-field-label">Target Exam Date</label>
                <input
                  type="date"
                  className="sq-sp-input"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
                <small className="sq-sp-field-hint">
                  AI will calculate days remaining and spread your study sessions evenly.
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

          {/* ---------------- STEP 2: STUDY MATERIAL (PHOTO SCREEN) ---------------- */}
          {step === 2 && (
            <div className="sq-sp-step-body">
              {/* Material Source Selector Tabs matching photo */}
              <div className="sq-sp-source-toggle-grid">
                {/* Upload files box */}
                <div
                  className={`sq-sp-source-box ${materialTab === "upload" ? "active" : ""}`}
                  onClick={() => {
                    setMaterialTab("upload");
                    fileInputRef.current?.click();
                  }}
                >
                  <div className="sq-sp-source-badge sq-badge-purple">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="4" y="3" width="16" height="18" rx="3" fill="#6B21A8" stroke="#A855F7" strokeWidth="1.8" />
                      <line x1="8" y1="8" x2="16" y2="8" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                      <line x1="8" y1="12" x2="16" y2="12" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                      <line x1="8" y1="16" x2="12" y2="16" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="sq-sp-source-texts">
                    <strong className="sq-sp-source-title">Upload files</strong>
                    <span className="sq-sp-source-sub">
                      {isParsingDoc
                        ? "Reading file contents..."
                        : uploadedDocName
                        ? `Loaded: ${uploadedDocName}`
                        : "PDF, DOCX, PPTX, XLSX, TXT, Images"}
                    </span>
                  </div>
                </div>

                {/* Write notes box (Highlighted with blue border in photo) */}
                <div
                  className={`sq-sp-source-box ${materialTab === "notes" ? "active" : ""}`}
                  onClick={() => setMaterialTab("notes")}
                >
                  <div className="sq-sp-source-badge sq-badge-cyan">
                    <span>T</span>
                  </div>
                  <div className="sq-sp-source-texts">
                    <strong className="sq-sp-source-title">Write notes</strong>
                    <span className="sq-sp-source-sub">Or describe the topics</span>
                  </div>
                </div>
              </div>

              {/* Your Notes Textarea matching photo */}
              <div className="sq-sp-field-group">
                <label className="sq-sp-field-label">Your Notes</label>
                <textarea
                  className="sq-sp-textarea"
                  rows={6}
                  placeholder="Describe what you need to learn, paste notes, or explain the topics..."
                  value={materialNotes}
                  onChange={(e) => setMaterialNotes(e.target.value)}
                />
              </div>

              {/* Paste a URL input group matching photo */}
              <div className="sq-sp-field-group">
                <div className="sq-sp-url-row">
                  <input
                    type="text"
                    className="sq-sp-url-input"
                    placeholder="Paste a URL (webpage, Wikipedia, etc.)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
                  />
                  <button
                    type="button"
                    className="sq-sp-url-add-btn"
                    onClick={handleAddUrl}
                  >
                    Add
                  </button>
                </div>
                {addedUrls.length > 0 && (
                  <div className="sq-sp-added-tags">
                    {addedUrls.map((u, i) => (
                      <span key={i} className="sq-sp-url-tag">🔗 {u}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Plan Language dropdown matching photo */}
              <div className="sq-sp-field-group">
                <label className="sq-sp-field-label">Plan Language</label>
                <div className="sq-sp-select-wrap">
                  <select
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

              {/* Bottom Action Bar: Back on left, Generate Study Plan on right (matching photo) */}
              <div className="sq-sp-card-bottom-bar">
                <button
                  type="button"
                  className="sq-sp-btn-back"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="sq-sp-btn-gold"
                  onClick={handleGeneratePlan}
                >
                  Generate Study Plan
                </button>
              </div>
            </div>
          )}

          {/* ---------------- STEP 3: GENERATING (AI Engine) ---------------- */}
          {step === 3 && (
            <div className="sq-sp-generating-view">
              <div className="sq-sp-spinner-large" />
              <h3>Generating Your Personalized Study Plan</h3>
              <p className="sq-sp-gen-engine-tag">⚡ Powered by Groq AI · openai/gpt-oss-120b</p>
              <p className="sq-sp-gen-live-status">{generatingStatus}</p>
            </div>
          )}

          {/* ---------------- STEP 4: REVIEW ACTIVE PLAN ---------------- */}
          {step === 4 && activePlan && (
            <div className="sq-sp-review-view">
              <div className="sq-sp-review-head">
                <div>
                  <span className="sq-sp-review-badge">✓ Plan Ready</span>
                  <h2>{activePlan.examName}</h2>
                  <p>
                    Target Date: <strong>{activePlan.examDate}</strong> · ({activePlan.daysRemaining} days remaining)
                  </p>
                </div>
                <button
                  type="button"
                  className="sq-sp-reset-link"
                  onClick={handleDeletePlan}
                >
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
                      href={sess.gameUrl || (sess.game?.toLowerCase().includes("nerd") ? "/games/angry-nerds" : "/games/study-cafe")}
                      className="sq-sp-sess-play-btn"
                    >
                      Play {sess.game} →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
