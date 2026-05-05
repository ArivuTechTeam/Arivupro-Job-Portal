import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COURSES, QUIZ_QUESTIONS, THEORY_QUESTIONS } from '../data/examData';

// ─── Timer hook ───────────────────────────────────────────────────────────────
function useTimer(initialSeconds, onExpire) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
      return;
    }
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft, onExpire]);

  const fmt = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return { secondsLeft, formatted: fmt(secondsLeft) };
}

// ─── Phase constants ──────────────────────────────────────────────────────────
const PHASE_QUIZ = 'quiz';
const PHASE_THEORY = 'theory';
const PHASE_RESULTS = 'results';

const QUIZ_DURATION = 45 * 60;   // 45 minutes
const THEORY_DURATION = 120 * 60; // 2 hours

// ─── Shared timer bar ─────────────────────────────────────────────────────────
function TimerBar({ secondsLeft, totalSeconds, label }) {
  const pct = Math.max(0, (secondsLeft / totalSeconds) * 100);
  const isWarning = secondsLeft < totalSeconds * 0.2;
  const isCritical = secondsLeft < 120;
  const color = isCritical ? '#dc2626' : isWarning ? '#f59e0b' : '#16a34a';
  const fmt = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '0.6rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        minWidth: 180,
      }}
    >
      <span style={{ fontSize: '1rem' }}>{isCritical ? '⚠️' : '⏱️'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{label}</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{fmt(secondsLeft)}</span>
        </div>
        <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: color,
              borderRadius: 2,
              transition: 'width 1s linear, background 0.5s',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Quiz Section ─────────────────────────────────────────────────────────────
function QuizSection({ course, questions, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  const handleExpire = useCallback(() => {
    finishQuiz(answers);
  }, [answers]);

  const { secondsLeft } = useTimer(QUIZ_DURATION, handleExpire);

  const q = questions[current];
  const answered = Object.keys(answers).length;
  const total = questions.length;

  function selectOption(idx) {
    setAnswers((prev) => ({ ...prev, [q.id]: idx }));
  }

  function finishQuiz(finalAnswers) {
    let score = 0;
    questions.forEach((question) => {
      if (finalAnswers[question.id] === question.correct) {
        score += question.marks;
      }
    });
    onComplete({ answers: finalAnswers, score, total: questions.reduce((s, q) => s + q.marks, 0) });
  }

  const unanswered = questions.filter((q) => answers[q.id] === undefined).length;

  return (
    <div>
      {/* Section Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: 12,
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
            🎯 Section A — Quiz (30 Marks)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {course.label} · {total} MCQ questions · 3 marks each · No negative marking
          </p>
        </div>
        <TimerBar secondsLeft={secondsLeft} totalSeconds={QUIZ_DURATION} label="Quiz Timer" />
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {questions.map((question, idx) => {
          const isAnswered = answers[question.id] !== undefined;
          const isCurrent = idx === current;
          return (
            <button
              key={question.id}
              onClick={() => setCurrent(idx)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: isCurrent ? `2px solid ${course.color}` : '1px solid #e2e8f0',
                background: isCurrent
                  ? course.bg
                  : isAnswered
                  ? '#d1fae5'
                  : '#fff',
                color: isCurrent ? course.color : isAnswered ? '#15803d' : '#64748b',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Question Card */}
      <div
        className="card"
        style={{ marginBottom: '1.5rem', border: `1px solid ${course.border}` }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 700, color: '#1e293b' }}>
            Question {current + 1} of {total}
          </span>
          <span
            style={{
              background: course.bg,
              color: course.color,
              border: `1px solid ${course.border}`,
              borderRadius: 20,
              padding: '0.2rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            {q.marks} marks
          </span>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <p
            style={{
              fontSize: '1rem',
              color: '#1e293b',
              lineHeight: 1.7,
              marginBottom: '1.5rem',
              fontWeight: 500,
            }}
          >
            {q.question}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {q.options.map((opt, idx) => {
              const selected = answers[q.id] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => selectOption(idx)}
                  style={{
                    padding: '0.875rem 1.25rem',
                    border: selected ? `2px solid ${course.color}` : '1.5px solid #e2e8f0',
                    borderRadius: 10,
                    background: selected ? course.bg : '#fff',
                    color: selected ? course.color : '#374151',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: selected ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) e.currentTarget.style.background = '#fff';
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: selected ? `2px solid ${course.color}` : '1.5px solid #cbd5e1',
                      background: selected ? course.color : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: selected ? '#fff' : '#64748b',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {selected ? '✓' : String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          style={{
            padding: '0.6rem 1.25rem',
            background: current === 0 ? '#f1f5f9' : '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            color: current === 0 ? '#94a3b8' : '#374151',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: current === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          ← Previous
        </button>

        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
          {answered} / {total} answered
        </span>

        {current < total - 1 ? (
          <button
            onClick={() => setCurrent((c) => c + 1)}
            style={{
              padding: '0.6rem 1.25rem',
              background: course.color,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            style={{
              padding: '0.6rem 1.5rem',
              background: '#16a34a',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Submit Quiz →
          </button>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '2rem',
              maxWidth: 420,
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#1e293b' }}>
              Submit Quiz?
            </h3>
            {unanswered > 0 && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 8,
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                  color: '#92400e',
                  fontSize: '0.875rem',
                }}
              >
                ⚠️ You have {unanswered} unanswered question{unanswered > 1 ? 's' : ''}.
                Unanswered questions will score 0 marks.
              </div>
            )}
            <p style={{ color: '#475569', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Once submitted, you cannot change your Quiz answers. You will then proceed to the Theory section (70 marks).
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Review Answers
              </button>
              <button
                onClick={() => { setShowConfirm(false); finishQuiz(answers); }}
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  background: '#16a34a',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Submit & Continue →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Theory Section ───────────────────────────────────────────────────────────
function TheorySection({ course, questions, quizResult, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeQ, setActiveQ] = useState(0);

  const handleExpire = useCallback(() => {
    onComplete({ answers });
  }, [answers]);

  const { secondsLeft } = useTimer(THEORY_DURATION, handleExpire);

  const totalAnswered = questions.filter((q) => (answers[q.id] || '').trim().length > 50).length;

  return (
    <div>
      {/* Quiz Result Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
          border: '1px solid #bbf7d0',
          borderRadius: 12,
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.1rem' }}>✅</span>
            <span style={{ fontWeight: 700, color: '#15803d', fontSize: '0.95rem' }}>
              Quiz Completed — {quizResult.score}/{quizResult.total} marks
            </span>
          </div>
          <p style={{ color: '#475569', fontSize: '0.875rem' }}>
            Now complete the Theory section to finish your assessment.
          </p>
        </div>
        <TimerBar secondsLeft={secondsLeft} totalSeconds={THEORY_DURATION} label="Theory Timer" />
      </div>

      {/* Section Header */}
      <div
        style={{
          background: '#fff',
          border: `1px solid ${course.border}`,
          borderRadius: 12,
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <h2 style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
            ✍️ Section B — Theory (70 Marks)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {course.label} · {questions.length} descriptive questions · Attempt all questions
          </p>
        </div>
        <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
          {totalAnswered} / {questions.length} answered
        </div>
      </div>

      {/* Layout: question tabs + answer area */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left: question list */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            overflow: 'hidden',
            position: 'sticky',
            top: 16,
          }}
        >
          {questions.map((q, idx) => {
            const wordCount = (answers[q.id] || '').trim().split(/\s+/).filter(Boolean).length;
            const done = wordCount > 30;
            return (
              <button
                key={q.id}
                onClick={() => setActiveQ(idx)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: activeQ === idx ? course.bg : '#fff',
                  borderBottom: '1px solid #f1f5f9',
                  border: 'none',
                  borderLeft: activeQ === idx ? `3px solid ${course.color}` : '3px solid transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: done ? '#d1fae5' : activeQ === idx ? course.bg : '#f1f5f9',
                    border: done ? '1.5px solid #6ee7b7' : activeQ === idx ? `1.5px solid ${course.color}` : '1.5px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: done ? '#15803d' : activeQ === idx ? course.color : '#64748b',
                    flexShrink: 0,
                  }}
                >
                  {done ? '✓' : idx + 1}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: activeQ === idx ? 700 : 500,
                      color: activeQ === idx ? course.color : '#374151',
                    }}
                  >
                    Question {idx + 1}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {q.marks} marks · {wordCount > 0 ? `${wordCount} words` : 'Not started'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: active question + answer */}
        <div>
          {questions.map((q, idx) => {
            if (idx !== activeQ) return null;
            const wordCount = (answers[q.id] || '').trim().split(/\s+/).filter(Boolean).length;
            return (
              <div key={q.id} className="card" style={{ border: `1px solid ${course.border}` }}>
                <div
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>
                    Question {idx + 1}
                  </span>
                  <span
                    style={{
                      background: course.bg,
                      color: course.color,
                      border: `1px solid ${course.border}`,
                      borderRadius: 20,
                      padding: '0.2rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    {q.marks} marks
                  </span>
                </div>

                <div style={{ padding: '1.5rem' }}>
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '1rem 1.25rem',
                      marginBottom: '1.25rem',
                      fontSize: '0.925rem',
                      color: '#1e293b',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {q.question}
                  </div>

                  {q.hint && (
                    <div
                      style={{
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: 8,
                        padding: '0.75rem 1rem',
                        marginBottom: '1rem',
                        fontSize: '0.8rem',
                        color: '#92400e',
                      }}
                    >
                      <strong>Examiner's hint:</strong> {q.hint}
                    </div>
                  )}

                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Your Answer
                  </label>
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder="Write your detailed answer here. Show all workings, calculations, and journal entries clearly..."
                    rows={14}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      lineHeight: 1.7,
                      resize: 'vertical',
                      color: '#1e293b',
                      outline: 'none',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = course.color; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '0.5rem',
                      fontSize: '0.78rem',
                      color: '#94a3b8',
                    }}
                  >
                    <span>{wordCount} words</span>
                    <span>Recommended: 300–500 words for full marks</span>
                  </div>

                  {/* Navigate to next question */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '1.25rem',
                    }}
                  >
                    <button
                      onClick={() => setActiveQ((i) => Math.max(0, i - 1))}
                      disabled={idx === 0}
                      style={{
                        padding: '0.6rem 1.25rem',
                        background: idx === 0 ? '#f1f5f9' : '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        color: idx === 0 ? '#94a3b8' : '#374151',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: idx === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      ← Previous
                    </button>

                    {idx < questions.length - 1 ? (
                      <button
                        onClick={() => setActiveQ((i) => i + 1)}
                        style={{
                          padding: '0.6rem 1.25rem',
                          background: course.color,
                          border: 'none',
                          borderRadius: 8,
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                        }}
                      >
                        Save & Next →
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowConfirm(true)}
                        style={{
                          padding: '0.6rem 1.5rem',
                          background: '#16a34a',
                          border: 'none',
                          borderRadius: 8,
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                        }}
                      >
                        Submit Theory →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit button (always visible) */}
      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setShowConfirm(true)}
          style={{
            padding: '0.75rem 2rem',
            background: '#16a34a',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          Submit Full Exam
        </button>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '2rem',
              maxWidth: 440,
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#1e293b' }}>
              Submit Theory Section?
            </h3>
            <div
              style={{
                background: '#f8fafc',
                borderRadius: 8,
                padding: '0.875rem',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                color: '#475569',
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                📝 Answered: {totalAnswered} / {questions.length} questions
              </div>
              <div>
                🎯 Quiz Score: {quizResult.score} / {quizResult.total} marks
              </div>
            </div>
            <p style={{ color: '#475569', marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Your theory answers will be submitted for evaluation. The AI will evaluate your responses against ICAI/exam standards and provide detailed feedback.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Review Answers
              </button>
              <button
                onClick={() => { setShowConfirm(false); onComplete({ answers }); }}
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  background: '#16a34a',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Submit Now ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Results Section ──────────────────────────────────────────────────────────
function ResultsSection({ course, quizResult, theoryAnswers, quizQuestions, onRetake }) {
  const navigate = useNavigate();
  const scorePercent = Math.round((quizResult.score / quizResult.total) * 100);
  const attempted = Object.values(theoryAnswers).filter((a) => a && a.trim().length > 30).length;
  const totalTheoryQ = Object.keys(theoryAnswers).length;

  const getGrade = (pct) => {
    if (pct >= 90) return { grade: 'A+', color: '#15803d', label: 'Excellent' };
    if (pct >= 75) return { grade: 'A', color: '#16a34a', label: 'Very Good' };
    if (pct >= 60) return { grade: 'B', color: '#2563eb', label: 'Good' };
    if (pct >= 50) return { grade: 'C', color: '#d97706', label: 'Average' };
    return { grade: 'D', color: '#dc2626', label: 'Needs Improvement' };
  };

  const { grade, color, label } = getGrade(scorePercent);

  return (
    <div>
      {/* Hero Result Card */}
      <div
        style={{
          background: `linear-gradient(135deg, ${course.bg} 0%, #fff 100%)`,
          border: `1px solid ${course.border}`,
          borderRadius: 16,
          padding: '2rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
        <h2 style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          Exam Submitted Successfully!
        </h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{course.label} — Full Assessment</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Quiz Score */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '1.25rem 2rem',
              minWidth: 160,
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 800, color: color, lineHeight: 1 }}>
              {quizResult.score}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              out of {quizResult.total}
            </div>
            <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Quiz Score
            </div>
          </div>

          {/* Theory */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '1.25rem 2rem',
              minWidth: 160,
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#7c3aed', lineHeight: 1 }}>
              {attempted}/{totalTheoryQ}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              questions answered
            </div>
            <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Theory (Pending AI Eval)
            </div>
          </div>

          {/* Quiz Grade */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '1.25rem 2rem',
              minWidth: 160,
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>
              {grade}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              {scorePercent}% in Quiz
            </div>
            <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {label}
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Answer Review */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">🎯 Quiz Answer Review</h3>
        </div>
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {quizQuestions.map((q, idx) => {
              const userAnswer = quizResult.answers?.[q.id];
              const isCorrect = userAnswer === q.correct;
              const notAnswered = userAnswer === undefined;
              return (
                <div
                  key={q.id}
                  style={{
                    padding: '0.875rem',
                    borderRadius: 8,
                    border: `1px solid ${notAnswered ? '#e2e8f0' : isCorrect ? '#bbf7d0' : '#fecaca'}`,
                    background: notAnswered ? '#f8fafc' : isCorrect ? '#f0fdf4' : '#fef2f2',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.4rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ color: '#475569' }}>Q{idx + 1}</span>
                    <span
                      style={{
                        color: notAnswered ? '#64748b' : isCorrect ? '#15803d' : '#dc2626',
                      }}
                    >
                      {notAnswered ? 'Skipped (0)' : isCorrect ? `+${q.marks}` : '0'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#374151', lineHeight: 1.5, marginBottom: '0.4rem' }}>
                    {q.question.length > 80 ? q.question.substring(0, 80) + '...' : q.question}
                  </p>
                  {!notAnswered && !isCorrect && (
                    <p style={{ fontSize: '0.75rem', color: '#15803d' }}>
                      Correct: {q.options[q.correct]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Theory Status */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">✍️ Theory Evaluation Status</h3>
        </div>
        <div style={{ padding: '1rem' }}>
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 8,
              padding: '1rem',
              marginBottom: '1rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>🤖</span>
            <div>
              <p style={{ fontWeight: 600, color: '#1e40af', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                AI Evaluation Queued
              </p>
              <p style={{ color: '#3b82f6', fontSize: '0.825rem', lineHeight: 1.5 }}>
                Your {attempted} theory answer{attempted !== 1 ? 's' : ''} have been submitted for AI evaluation. The system will evaluate your responses against {course.board} standards and provide detailed step-wise feedback, model answer comparisons, and improvement suggestions.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {THEORY_QUESTIONS[course.id]?.map((q, idx) => {
              const answer = theoryAnswers[q.id] || '';
              const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
              return (
                <div
                  key={q.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0.875rem',
                    background: '#f8fafc',
                    borderRadius: 6,
                    fontSize: '0.85rem',
                  }}
                >
                  <span style={{ color: '#374151' }}>
                    Q{idx + 1}: {q.question.substring(0, 50)}...
                  </span>
                  <span
                    style={{
                      color: wordCount > 30 ? '#15803d' : '#64748b',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      flexShrink: 0,
                    }}
                  >
                    {wordCount > 30 ? `${wordCount} words` : 'Not answered'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/exam')}
          style={{
            padding: '0.75rem 1.5rem',
            background: course.color,
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Try Another Course
        </button>
        <button
          onClick={onRetake}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            color: '#374151',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Retake This Exam
        </button>
        <button
          onClick={() => navigate('/submissions')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            color: '#374151',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          View My Submissions
        </button>
        <button
          onClick={() => navigate('/mistakes')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            color: '#374151',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Mistake Library
        </button>
      </div>
    </div>
  );
}

// ─── Main StudentExam Page ────────────────────────────────────────────────────
export function StudentExam() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const course = COURSES.find((c) => c.id === courseId);
  const quizQuestions = QUIZ_QUESTIONS[courseId] || [];
  const theoryQuestions = THEORY_QUESTIONS[courseId] || [];

  const [phase, setPhase] = useState(PHASE_QUIZ);
  const [quizResult, setQuizResult] = useState(null);
  const [theoryAnswers, setTheoryAnswers] = useState({});

  // Redirect if course not found
  if (!course) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Course Not Found</h1>
        </div>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>
            The course you selected does not exist.
          </p>
          <button
            onClick={() => navigate('/exam')}
            className="btn btn-primary"
          >
            Back to Course Selection
          </button>
        </div>
      </div>
    );
  }

  function handleQuizComplete(result) {
    setQuizResult(result);
    setPhase(PHASE_THEORY);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleTheoryComplete(result) {
    setTheoryAnswers(result.answers);
    setPhase(PHASE_RESULTS);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleRetake() {
    setPhase(PHASE_QUIZ);
    setQuizResult(null);
    setTheoryAnswers({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const phaseSteps = [
    { id: PHASE_QUIZ, label: 'Quiz', marks: 30, icon: '🎯' },
    { id: PHASE_THEORY, label: 'Theory', marks: 70, icon: '✍️' },
    { id: PHASE_RESULTS, label: 'Results', marks: null, icon: '📊' },
  ];
  const currentPhaseIdx = phaseSteps.findIndex((p) => p.id === phase);

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/exam')}
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '0.4rem 0.875rem',
              fontSize: '0.85rem',
              color: '#475569',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            ← Courses
          </button>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{course.icon}</span>
              <span>{course.label}</span>
            </h1>
            <p className="subtitle">Full Assessment · 100 Marks</p>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      {phase !== PHASE_RESULTS && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            marginBottom: '1.5rem',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '0.75rem 1.25rem',
          }}
        >
          {phaseSteps.map((step, idx) => {
            const isActive = step.id === phase;
            const isDone = idx < currentPhaseIdx;
            return (
              <React.Fragment key={step.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: isDone ? 0.7 : 1,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isDone ? '#d1fae5' : isActive ? course.color : '#f1f5f9',
                      border: isActive ? `2px solid ${course.color}` : '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isDone ? '0.8rem' : '1rem',
                      fontWeight: 700,
                      color: isDone ? '#15803d' : isActive ? '#fff' : '#94a3b8',
                    }}
                  >
                    {isDone ? '✓' : step.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? course.color : isDone ? '#15803d' : '#94a3b8',
                      }}
                    >
                      {step.label}
                    </div>
                    {step.marks && (
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{step.marks} marks</div>
                    )}
                  </div>
                </div>
                {idx < phaseSteps.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: idx < currentPhaseIdx ? '#bbf7d0' : '#f1f5f9',
                      margin: '0 0.75rem',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Phase Content */}
      {phase === PHASE_QUIZ && (
        <QuizSection
          course={course}
          questions={quizQuestions}
          onComplete={handleQuizComplete}
        />
      )}

      {phase === PHASE_THEORY && quizResult && (
        <TheorySection
          course={course}
          questions={theoryQuestions}
          quizResult={quizResult}
          onComplete={handleTheoryComplete}
        />
      )}

      {phase === PHASE_RESULTS && quizResult && (
        <ResultsSection
          course={course}
          quizResult={quizResult}
          theoryAnswers={theoryAnswers}
          quizQuestions={quizQuestions}
          onRetake={handleRetake}
        />
      )}
    </div>
  );
}

export default StudentExam;
