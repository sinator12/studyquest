import React, { useState, useEffect } from "react";
import TopNav from "./TopNav";
import { getActiveDeck, type DeckInfo } from "./studyStore";
import "./studyPlan.css";

interface StudyPlan {
  id: string;
  examName: string;
  examDate: string;
  daysRemaining: number;
  materialName: string;
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
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [examName, setExamName] = useState("Biology Midterm");
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [materialNotes, setMaterialNotes] = useState(
    "Key concepts: Cell division, Mitosis, Meiosis, DNA replication, Photosynthesis"
  );
  const [activeDeck] = useState<DeckInfo>(getActiveDeck());
  const [showFeedback, setShowFeedback] = useState(true);

  // Load saved study plan from localStorage
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

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const targetDate = new Date(examDate);
    const today = new Date();
    const diffTime = Math.max(0, targetDate.getTime() - today.getTime());
    const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const newPlan: StudyPlan = {
      id: "plan-" + Date.now(),
      examName: examName.trim() || "Upcoming Exam",
      examDate,
      daysRemaining,
      materialName: activeDeck?.title || examName,
      createdAt: new Date().toISOString(),
      sessions: [
        {
          day: 1,
          title: "Warm-up & Core Concepts",
          description: "Review fundamentals and build foundational memory.",
          game: "Study Cafe",
          gameUrl: "/games/study-cafe",
          done: false
        },
        {
          day: 2,
          title: "Speed Challenge & Retention",
          description: "Test your quick recall with trajectory physics.",
          game: "Angry Nerds",
          gameUrl: "/games/angry-nerds",
          done: false
        },
        {
          day: 3,
          title: "Comprehensive Review & Exam Readiness",
          description: "Full-speed review session to master all questions.",
          game: "Study Cafe",
          gameUrl: "/games/study-cafe",
          done: false
        }
      ]
    };

    setActivePlan(newPlan);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlan));
    setIsModalOpen(false);
  };

  const handleToggleSession = (index: number) => {
    if (!activePlan) return;
    const updated = { ...activePlan };
    updated.sessions[index].done = !updated.sessions[index].done;
    setActivePlan(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleDeletePlan = () => {
    setActivePlan(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="sq-study-plan-body">
      {/* Navigation Header */}
      <TopNav activeTab="study-plan" />

      <main className="sq-sp-main">
        {/* Breadcrumb matching Photo 2 */}
        <div className="sq-sp-breadcrumb">
          <a href="/dashboard">Home</a>
          <span className="sq-sp-sep">&gt;</span>
          <span className="sq-sp-current">Study Plan</span>
        </div>

        {/* Hero Section: Mascot on Left + Speech Bubble on Right */}
        <div className="sq-sp-hero">
          {/* Mascot Illustration with Brain & Sparks */}
          <div className="sq-sp-mascot-container">
            {/* Sparkle stars & floating question badge */}
            <div className="sq-sp-star sq-sp-star-tl">✦</div>
            <div className="sq-sp-star sq-sp-star-tr">✦</div>
            <div className="sq-sp-qmark-badge">?</div>

            {/* Mascot Graphic (Purple Gamepad + Brain) */}
            <div className="sq-sp-mascot-art">
              <svg viewBox="0 0 160 140" width="150" height="135" fill="none">
                {/* Golden Glowing Brain on Top */}
                <g className="sq-sp-brain-top">
                  <ellipse cx="64" cy="38" rx="22" ry="18" fill="#FBBF24" />
                  <ellipse cx="96" cy="38" rx="22" ry="18" fill="#FBBF24" />
                  <ellipse cx="80" cy="40" rx="16" ry="14" fill="#F59E0B" />
                  {/* Brain Folds */}
                  <path
                    d="M54 36C56 30 68 28 72 34C74 38 66 44 60 42"
                    stroke="#D97706"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M106 36C104 30 92 28 88 34C86 38 94 44 100 42"
                    stroke="#D97706"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <line x1="80" y1="24" x2="80" y2="50" stroke="#D97706" strokeWidth="2.5" />
                </g>

                {/* Gamepad Controller Body */}
                <path
                  d="M44 68C32 68 24 78 24 92C24 108 36 122 52 122C62 122 70 114 80 114C90 114 98 122 108 122C124 122 136 108 136 92C136 78 128 68 116 68H44Z"
                  fill="#7C3AED"
                />
                {/* Controller Grips Base */}
                <rect x="36" y="94" width="22" height="26" rx="10" fill="#6D28D9" />
                <rect x="102" y="94" width="22" height="26" rx="10" fill="#6D28D9" />

                {/* Golden Smiling Face Badge */}
                <circle cx="80" cy="88" r="16" fill="#FBBF24" />
                {/* Eyes */}
                <ellipse cx="75" cy="86" rx="2.5" ry="3" fill="#1E1B4B" />
                <ellipse cx="85" cy="86" rx="2.5" ry="3" fill="#1E1B4B" />
                <circle cx="76" cy="85" r="0.9" fill="#FFFFFF" />
                <circle cx="86" cy="85" r="0.9" fill="#FFFFFF" />
                {/* Cute Smile */}
                <path
                  d="M76 92C77.5 94.5 82.5 94.5 84 92"
                  stroke="#1E1B4B"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Rosy Cheeks */}
                <ellipse cx="72" cy="90" rx="2" ry="1.2" fill="#F87171" opacity="0.8" />
                <ellipse cx="88" cy="90" rx="2" ry="1.2" fill="#F87171" opacity="0.8" />

                {/* Left D-pad buttons */}
                <rect x="42" y="84" width="10" height="4" rx="2" fill="#C4B5FD" />
                <rect x="45" y="81" width="4" height="10" rx="2" fill="#C4B5FD" />

                {/* Right Action buttons */}
                <circle cx="114" cy="83" r="2.5" fill="#C4B5FD" />
                <circle cx="120" cy="88" r="2.5" fill="#C4B5FD" />
              </svg>
            </div>
          </div>

          {/* Speech Bubble Card matching Photo 2 */}
          <div className="sq-sp-speech-card">
            <div className="sq-sp-speech-badge-row">
              <span className="sq-sp-badge-ai">AI-Powered Study Plans</span>
              <span className="sq-sp-badge-beta">Beta</span>
            </div>
            <h1 className="sq-sp-speech-title">Personalized Learning Plans</h1>
            <p className="sq-sp-speech-sub">
              Upload your study material, set your exam date, and let AI create a personalized study plan tailored just for you.
            </p>
          </div>
        </div>

        {/* Main Action Box matching Photo 2 */}
        <section className="sq-sp-action-box">
          <div className="sq-sp-box-head">
            <h2 className="sq-sp-box-title">Got an exam coming up?</h2>
            <p className="sq-sp-box-sub">Make a plan in three steps.</p>
          </div>

          {/* Three Step Cards */}
          <div className="sq-sp-steps-row">
            {/* Step 1: Tell me the exam date */}
            <div
              className="sq-sp-step-card"
              role="button"
              tabIndex={0}
              onClick={() => setIsModalOpen(true)}
              onKeyDown={(e) => e.key === "Enter" && setIsModalOpen(true)}
            >
              <div className="sq-sp-step-icon sq-sp-icon-target">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#A855F7" strokeWidth="2.5" />
                  <circle cx="12" cy="12" r="6" stroke="#C084FC" strokeWidth="2" />
                  <circle cx="12" cy="12" r="2.5" fill="#C084FC" />
                </svg>
              </div>
              <span className="sq-sp-step-label">Tell me the exam date</span>
            </div>

            {/* Step 2: Add your material */}
            <div
              className="sq-sp-step-card"
              role="button"
              tabIndex={0}
              onClick={() => setIsModalOpen(true)}
              onKeyDown={(e) => e.key === "Enter" && setIsModalOpen(true)}
            >
              <div className="sq-sp-step-icon sq-sp-icon-doc">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="3" width="16" height="18" rx="3" fill="#6B21A8" stroke="#A855F7" strokeWidth="2" />
                  <line x1="8" y1="8" x2="16" y2="8" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="8" y1="12" x2="16" y2="12" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="8" y1="16" x2="13" y2="16" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <span className="sq-sp-step-label">Add your material</span>
            </div>

            {/* Step 3: Study one session at a time */}
            <div
              className="sq-sp-step-card"
              role="button"
              tabIndex={0}
              onClick={() => setIsModalOpen(true)}
              onKeyDown={(e) => e.key === "Enter" && setIsModalOpen(true)}
            >
              <div className="sq-sp-step-icon sq-sp-icon-play">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="11" fill="#10B981" />
                  <polygon points="10 8 16 12 10 16" fill="#FFFFFF" />
                </svg>
              </div>
              <span className="sq-sp-step-label sq-sp-step-stacked">
                <span>Study one session at a</span>
                <span>time</span>
              </span>
            </div>
          </div>

          {/* Action Box Footer Bar */}
          <div className="sq-sp-box-foot">
            <span className="sq-sp-free-text">Free plan: one study plan</span>
            <button
              type="button"
              className="sq-sp-cta-btn"
              onClick={() => setIsModalOpen(true)}
            >
              Create New Study Plan
            </button>
          </div>
        </section>

        {/* If Active Study Plan Exists: Display Active Plan Schedule */}
        {activePlan && (
          <section className="sq-sp-active-plan-container">
            <div className="sq-sp-active-card">
              <div className="sq-sp-active-head">
                <div>
                  <div className="sq-sp-active-pill">Active Study Plan</div>
                  <h3 className="sq-sp-active-title">{activePlan.examName}</h3>
                  <p className="sq-sp-active-sub">
                    Exam Date: <strong>{activePlan.examDate}</strong> ({activePlan.daysRemaining} days left) · Material: {activePlan.materialName}
                  </p>
                </div>
                <button
                  type="button"
                  className="sq-sp-delete-btn"
                  onClick={handleDeletePlan}
                  title="Remove this plan"
                >
                  Reset Plan
                </button>
              </div>

              <div className="sq-sp-sessions-list">
                {activePlan.sessions.map((sess, idx) => (
                  <div key={idx} className={`sq-sp-session-item ${sess.done ? "done" : ""}`}>
                    <label className="sq-sp-session-check">
                      <input
                        type="checkbox"
                        checked={sess.done}
                        onChange={() => handleToggleSession(idx)}
                      />
                      <span className="sq-sp-check-box" />
                    </label>
                    <div className="sq-sp-session-info">
                      <div className="sq-sp-session-top">
                        <span className="sq-sp-session-day">Day {sess.day}</span>
                        <h4 className="sq-sp-session-name">{sess.title}</h4>
                      </div>
                      <p className="sq-sp-session-desc">{sess.description}</p>
                    </div>
                    <a href={sess.gameUrl} className="sq-sp-play-chip">
                      Play {sess.game} →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="sq-sp-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="sq-sp-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="sq-sp-modal-close"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
            <div className="sq-sp-modal-head">
              <span className="sq-sp-badge-ai">Step-by-Step Generator</span>
              <h3>Create Your AI Study Plan</h3>
              <p>Personalize your schedule around your actual exam date and notes.</p>
            </div>

            <form onSubmit={handleCreatePlan} className="sq-sp-form">
              <div className="sq-sp-form-group">
                <label>1. What exam are you preparing for?</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Biology Midterm, Calculus Final, AP History"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                />
              </div>

              <div className="sq-sp-form-group">
                <label>2. When is your exam date?</label>
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>

              <div className="sq-sp-form-group">
                <label>3. Add your study material or key concepts:</label>
                <textarea
                  rows={4}
                  placeholder="Paste chapter notes, study guides, or key terms..."
                  value={materialNotes}
                  onChange={(e) => setMaterialNotes(e.target.value)}
                />
              </div>

              <div className="sq-sp-form-actions">
                <button
                  type="button"
                  className="sq-sp-btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="sq-sp-btn-submit">
                  Generate My Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer matching Photo 2 */}
      <footer className="sq-sp-footer">
        <div className="sq-sp-footer-inner">
          {/* Brand info */}
          <div className="sq-sp-footer-brand">
            <div className="sq-sp-footer-logo">
              <svg viewBox="0 0 36 36" width="30" height="30" fill="none">
                <rect width="36" height="36" rx="8" fill="#7C3AED" />
                <circle cx="18" cy="18" r="7.5" fill="#FFA500" />
                <circle cx="15.5" cy="17" r="1.3" fill="#1E1B4B" />
                <circle cx="20.5" cy="17" r="1.3" fill="#1E1B4B" />
                <path d="M16 20C16.8 21 19.2 21 20 20" stroke="#1E1B4B" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className="sq-sp-footer-title">StudyQuest</span>
            </div>
            <p className="sq-sp-footer-desc">
              Interactive learning through engaging games and quizzes.
            </p>
            <div className="sq-sp-socials">
              <a href="#linkedin" title="LinkedIn">in</a>
              <a href="#instagram" title="Instagram">📷</a>
              <a href="#tiktok" title="TikTok">♪</a>
              <a href="mailto:support@studyquest.app" title="Email">✉</a>
            </div>
          </div>

          {/* Product */}
          <div className="sq-sp-footer-col">
            <h4>Product</h4>
            <ul>
              <li><a href="/games">Games</a></li>
              <li><a href="/study-plan">Study Plan</a></li>
              <li><a href="/explain">Explain</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="sq-sp-footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><a href="#reviews">Reviews</a></li>
              <li><a href="#blog">Blog</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="sq-sp-footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#refund">Refund Policy</a></li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Floating Give Feedback Button (Photo 2 Bottom Right) */}
      {showFeedback && (
        <div className="sq-sp-feedback-pill">
          <button
            type="button"
            className="sq-sp-feedback-close"
            onClick={() => setShowFeedback(false)}
            title="Dismiss"
          >
            ✕
          </button>
          <a href="mailto:feedback@studyquest.app" className="sq-sp-feedback-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Give feedback</span>
          </a>
        </div>
      )}
    </div>
  );
}
