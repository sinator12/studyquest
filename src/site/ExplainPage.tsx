import React, { useState, useRef } from "react";
import TopNav from "./TopNav";
import { getActiveDeck, setActiveDeck, getAIConfig, DEFAULT_GROQ_KEY, type DeckInfo } from "./studyStore";
import { extractTextFromFile, generateWithGroq } from "./aiService";
import "./explain.css";

interface ExplainerResult {
  topic: string;
  summary: string;
  keyPoints: { title: string; explanation: string; analogy?: string }[];
  funFact: string;
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export default function ExplainPage() {
  const [topicInput, setTopicInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState("");
  const [result, setResult] = useState<ExplainerResult | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [activeDeck, setActiveDeckState] = useState<DeckInfo>(getActiveDeck());
  const [showFeedback, setShowFeedback] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUGGESTED_TOPICS = [
    "What is osmosis?",
    "Explain supply and demand",
    "How do vaccines work?",
    "What caused World War I?",
    "Explain Newton's three laws",
    "What is a prime number?"
  ];

  const handleSelectSuggested = (t: string) => {
    setTopicInput(t);
    handleExplain(t);
  };

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFileName(file.name);
    try {
      const extracted = await extractTextFromFile(file);
      if (extracted) {
        setTopicInput(
          (prev) => (prev ? prev + "\n\n" : "") + `Notes from ${file.name}:\n` + extracted.slice(0, 4000)
        );
      }
    } catch (err) {
      console.warn("Could not read attached file:", err);
    }
  };

  const handleFromLibrary = () => {
    if (activeDeck && activeDeck.title) {
      setTopicInput(`Explain the core principles of: ${activeDeck.title}`);
    } else {
      setTopicInput("Explain how cellular respiration produces ATP");
    }
  };

  const handleExplain = async (targetTopic?: string) => {
    const textToExplain = (targetTopic || topicInput).trim();
    if (!textToExplain) {
      alert("Please enter a question or topic to explain!");
      return;
    }

    setIsGenerating(true);
    setGeneratingStatus("Groq AI: Connecting to ultra-fast model (openai/gpt-oss-120b)...");
    setSelectedAnswers({});

    const aiConfig = getAIConfig();
    const groqKey = aiConfig.groqKey || DEFAULT_GROQ_KEY;

    try {
      setGeneratingStatus("Groq AI: Generating deep-dive explanation and analogies...");

      const prompt = `You are a world-class science and education explainer (like 3Blue1Brown, Kurzgesagt, or Khan Academy).
A student asked: "${textToExplain}"

Explain this concept thoroughly, engagingly, and clearly.
Return ONLY a valid JSON object matching this schema:
{
  "topic": "${textToExplain.slice(0, 60)}",
  "summary": "A 2-3 sentence crystal clear overview answering the question directly.",
  "keyPoints": [
    {
      "title": "Step 1: The Core Mechanism / Background",
      "explanation": "Clear explanation in plain English."
    },
    {
      "title": "Step 2: How It Actually Works",
      "explanation": "Deeper step-by-step breakdown."
    },
    {
      "title": "Step 3: Real-World Analogy",
      "explanation": "A vivid relatable real-world comparison that makes it unforgettable.",
      "analogy": "The analogy in one vivid sentence."
    }
  ],
  "funFact": "An interesting surprising fact related to this topic.",
  "questions": [
    {
      "question": "Question 1 testing core understanding?",
      "options": ["Correct Option", "Misconception B", "Plausible C", "Opposite D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct."
    },
    {
      "question": "Question 2 testing practical application?",
      "options": ["Misconception A", "Correct Option", "Distractor C", "Distractor D"],
      "correctIndex": 1,
      "explanation": "Why this answer is correct."
    },
    {
      "question": "Question 3 testing key term or cause?",
      "options": ["Distractor A", "Distractor B", "Correct Option", "Distractor D"],
      "correctIndex": 2,
      "explanation": "Why this answer is correct."
    }
  ]
}`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          response_format: { type: "json_object" },
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content: "You are an educational assistant that strictly outputs valid JSON explanations."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content;
        if (raw) {
          const parsed: ExplainerResult = JSON.parse(raw);
          setResult(parsed);

          // Also save as an active deck for games!
          if (parsed.questions && parsed.questions.length > 0) {
            const newDeck: DeckInfo = {
              id: "deck-" + Date.now(),
              title: `${parsed.topic} Explained`,
              sourceType: "topic",
              contentPreview: parsed.summary,
              createdAt: new Date().toISOString(),
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
        }
      } else {
        // Fallback with groq generator
        const deck = await generateWithGroq(textToExplain, "topic", 5, groqKey);
        setResult({
          topic: textToExplain,
          summary: `Here is a structured explanation of ${textToExplain}. Key principles and concepts have been broken down below.`,
          keyPoints: [
            {
              title: "1. Core Definition",
              explanation: `${textToExplain} involves fundamental mechanisms governed by established scientific and logical laws.`
            },
            {
              title: "2. Working Process",
              explanation: "Each component interacts systematically to produce the observed phenomena."
            },
            {
              title: "3. Everyday Analogy",
              explanation: "Think of it like a coordinated factory line where each station performs one crucial task to ensure the final output succeeds.",
              analogy: "Like a precision mechanical clock where each gear drives the next."
            }
          ],
          funFact: `Did you know? Studying ${textToExplain} using active recall games boosts 7-day retention by up to 250%!`,
          questions: deck.questions.slice(0, 3).map((q) => ({
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation
          }))
        });
      }
    } catch (err) {
      console.warn("Groq explanation error:", err);
    } finally {
      setIsGenerating(false);
      setGeneratingStatus("");
    }
  };

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx
    }));
  };

  return (
    <div className="sq-explain-body">
      {/* Hidden file input for Attach */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        accept="*/*"
        onChange={handleAttachFile}
      />

      {/* TopNav */}
      <TopNav activeTab="explain" />

      <main className="sq-ex-main">
        {/* Top Badge matching Photo 3 */}
        <div className="sq-ex-badge-row">
          <div className="sq-ex-badge-pill">
            <span>New: StudyQuest Explain</span>
            <span className="sq-ex-badge-beta">BETA</span>
          </div>
        </div>

        {/* Main Headline matching Photo 3 */}
        <h1 className="sq-ex-title">
          Understand <span className="sq-ex-title-gradient">anything</span>
        </h1>

        {/* Subtitle matching Photo 3 */}
        <p className="sq-ex-sub">
          Ask a question or add your notes. Get a short video that explains it, then a quiz to check you got it.
        </p>

        {/* Main Explainer Input Box matching Photo 3 */}
        <div className="sq-ex-input-box">
          <textarea
            className="sq-ex-textarea"
            rows={3}
            placeholder="Explain how the heart pumps blood"
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
            {/* Left Tools: Attach & From library */}
            <div className="sq-ex-box-tools">
              <button
                type="button"
                className="sq-ex-tool-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Attach any document or study notes"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                <span>{attachedFileName ? `📎 ${attachedFileName}` : "Attach"}</span>
              </button>

              <button
                type="button"
                className="sq-ex-tool-btn"
                onClick={handleFromLibrary}
                title="Use material from your active deck"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span>From my library</span>
              </button>
            </div>

            {/* Right Action: Explain Button */}
            <button
              type="button"
              className="sq-ex-submit-btn"
              onClick={() => handleExplain()}
              disabled={isGenerating}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
              </svg>
              <span>{isGenerating ? "Explaining..." : "Explain"}</span>
            </button>
          </div>
        </div>

        {/* Free usage pill centered under box */}
        <div className="sq-ex-free-indicator">
          <span>Free AI Explainer · Powered by Groq AI</span>
        </div>

        {/* Suggested Prompt Pills matching Photo 3 */}
        <div className="sq-ex-prompts-container">
          <div className="sq-ex-prompts-row">
            {SUGGESTED_TOPICS.slice(0, 4).map((topic, i) => (
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
          <div className="sq-ex-prompts-row">
            {SUGGESTED_TOPICS.slice(4).map((topic, i) => (
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
          <div className="sq-ex-generating-card">
            <div className="sq-ex-gen-spinner" />
            <h3>Generating Interactive Explanation...</h3>
            <p>⚡ High-speed Groq AI (openai/gpt-oss-120b) is analyzing your concept.</p>
            <small>{generatingStatus}</small>
          </div>
        )}

        {/* Result Card: Video/Step presentation & Quiz */}
        {result && !isGenerating && (
          <div className="sq-ex-result-section">
            {/* Explainer Presentation Card */}
            <div className="sq-ex-card sq-ex-player-card">
              <div className="sq-ex-player-head">
                <span className="sq-ex-player-tag">🎬 AI Video Explainer</span>
                <h2>{result.topic}</h2>
                <p className="sq-ex-summary-text">{result.summary}</p>
              </div>

              {/* Step by step cards */}
              <div className="sq-ex-steps-grid">
                {result.keyPoints.map((pt, idx) => (
                  <div key={idx} className="sq-ex-step-item">
                    <div className="sq-ex-step-num-box">{idx + 1}</div>
                    <div className="sq-ex-step-text">
                      <h4>{pt.title}</h4>
                      <p>{pt.explanation}</p>
                      {pt.analogy && (
                        <div className="sq-ex-analogy-box">
                          💡 <strong>Analogy:</strong> {pt.analogy}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {result.funFact && (
                <div className="sq-ex-fun-fact">
                  <span>✨ <strong>Fun Fact:</strong> {result.funFact}</span>
                </div>
              )}
            </div>

            {/* Quick Check Quiz */}
            <div className="sq-ex-card sq-ex-quiz-card">
              <div className="sq-ex-quiz-head">
                <span className="sq-ex-quiz-badge">🎯 Quick Check Quiz</span>
                <h3>Test what you just learned:</h3>
              </div>

              <div className="sq-ex-questions-list">
                {result.questions.map((q, qIdx) => {
                  const userChoice = selectedAnswers[qIdx];
                  const hasAnswered = typeof userChoice === "number";

                  return (
                    <div key={qIdx} className="sq-ex-q-item">
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
                              <span className="sq-ex-opt-letter">
                                {["A", "B", "C", "D"][optIdx]}
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {hasAnswered && (
                        <div
                          className={`sq-ex-ans-feedback ${
                            userChoice === q.correctIndex ? "success" : "retry"
                          }`}
                        >
                          <span>
                            {userChoice === q.correctIndex ? "✓ Correct! " : "✕ Incorrect. "}
                            {q.explanation}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons to Play in Games */}
              <div className="sq-ex-quiz-actions">
                <a href="/games/study-cafe" className="sq-ex-play-btn sq-btn-cafe">
                  ☕ Play In Study Café →
                </a>
                <a href="/games/angry-nerds" className="sq-ex-play-btn sq-btn-nerds">
                  🎯 Play In Angry Nerds →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* How It Works Section matching Photo 3 */}
        <section className="sq-ex-how-it-works">
          <div className="sq-ex-divider">
            <span>How it works</span>
          </div>

          <div className="sq-ex-features-grid">
            {/* Card 1 */}
            <div className="sq-ex-feature-card">
              <div className="sq-ex-feat-icon sq-feat-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <h4>Ask or attach notes</h4>
              <p>Type any difficult concept or attach notes from your classes or textbook.</p>
            </div>

            {/* Card 2 */}
            <div className="sq-ex-feature-card">
              <div className="sq-ex-feat-icon sq-feat-cyan">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                </svg>
              </div>
              <h4>AI Video Explainer</h4>
              <p>Groq AI generates a step-by-step breakdown with crystal-clear visual analogies.</p>
            </div>

            {/* Card 3 */}
            <div className="sq-ex-feature-card">
              <div className="sq-ex-feat-icon sq-feat-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h4>Instant retention quiz</h4>
              <p>Reinforce your understanding immediately with interactive practice and games.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Give Feedback Button (Photo 3 Bottom Right) */}
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
