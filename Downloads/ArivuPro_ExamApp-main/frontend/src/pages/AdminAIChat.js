import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  HelpCircle, 
  ClipboardList, 
  Target, 
  Book, 
  Search, 
  GraduationCap, 
  Edit, 
  Bot, 
  Sparkles, 
  Hash, 
  Trash2, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Send,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

/* ── Suggested prompts ── */
const SUGGESTIONS = [
  { icon: <BarChart3 size={16} />, label: 'Analyze performance', prompt: 'What are the most common mistakes CA students make in Accounts and Audit papers?' },
  { icon: <HelpCircle size={16} />, label: 'Create question', prompt: 'Create a 10-mark question on "Ind AS 116 Leases" with a detailed marking scheme for CA Final.' },
  { icon: <ClipboardList size={16} />, label: 'Marking scheme', prompt: 'Draft a marking scheme for a 6-mark question on "Reconciliation of Cost and Financial Accounts".' },
  { icon: <Target size={16} />, label: 'Improvement tips', prompt: 'Give top 5 practical tips for students scoring below 40% in CA Intermediate Financial Management.' },
  { icon: <Book size={16} />, label: 'Topic guide', prompt: 'Provide a structured study plan for CA Foundation Paper 1: Principles and Practices of Accounting.' },
  { icon: <Search size={16} />, label: 'Common errors', prompt: 'List the most frequent presentation errors students make in CS Executive Company Law answers.' },
];

const SYSTEM_PRESETS = [
  { id: 'default', label: 'GraduationCap', icon: <GraduationCap size={16} />, title: 'Exam Assistant', desc: 'General CA/CS/CMA exam help' },
  { id: 'questions', label: 'HelpCircle', icon: <HelpCircle size={16} />, title: 'Question Creator', desc: 'Generate exam questions & marking schemes' },
  { id: 'analysis', label: 'BarChart3', icon: <BarChart3 size={16} />, title: 'Performance Analyst', desc: 'Analyze scores, weak areas & trends' },
  { id: 'custom', label: 'Edit', icon: <Edit size={16} />, title: 'Custom', desc: 'Set your own system prompt' },
];

const SYSTEM_PROMPTS = {
  default: '',
  questions: 'You are an expert CA/CS/CMA exam question creator for India. Generate precise exam questions with detailed marking schemes, expected answers, and common mistakes students make. Follow ICAI/ICSI/CMA exam format and standards.',
  analysis: 'You are a CA/CS/CMA exam performance analyst. Analyze student data, identify weak areas, suggest improvement strategies, and provide data-driven insights about exam performance trends.',
  custom: '',
};

/* ── Markdown-like renderer ── */
function MessageContent({ text }) {
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <div style={{ lineHeight: 1.65, fontSize: '0.9rem' }}>
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3).replace(/^[a-z]+\n/, '');
          return (
            <pre key={i} style={{
              background: '#1e1b4b', color: '#c7d2fe', padding: '0.85rem 1rem',
              borderRadius: 8, overflowX: 'auto', margin: '0.5rem 0',
              fontSize: '0.82rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap',
            }}>{code}</pre>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} style={{
            background: '#e0e7ff', color: '#3730a3', padding: '2px 6px',
            borderRadius: 4, fontFamily: 'monospace', fontSize: '0.85em',
          }}>{part.slice(1, -1)}</code>;
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        // Render newlines as <br>
        return part.split('\n').map((line, j, arr) => (
          <React.Fragment key={`${i}-${j}`}>
            {line}
            {j < arr.length - 1 && <br />}
          </React.Fragment>
        ));
      })}
    </div>
  );
}

export default function AdminAIChat() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [systemPreset, setSystemPreset] = useState('default');
  const [customPrompt, setCustomPrompt] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const getSystemPrompt = () => {
    if (systemPreset === 'custom') return customPrompt;
    return SYSTEM_PROMPTS[systemPreset] || '';
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const payload = newMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await authAPI.aiChat(payload, getSystemPrompt());
      const aiContent = res.data.message;
      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
      if (res.data.usage) setTotalTokens(t => t + (res.data.usage.total_tokens || 0));
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to get AI response. Check your OpenAI API key.';
      setError(msg);
      setMessages(prev => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const clearChat = () => {
    setMessages([]);
    setTotalTokens(0);
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 64px)',
      background: '#f8fafc', fontFamily: 'inherit',
    }}>

      {/* ── Sidebar ── */}
      {showSidebar && (
        <div style={{
          width: 280, background: '#fff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column',
          flexShrink: 0, overflowY: 'auto',
        }}>
          {/* Sidebar header */}
          <div style={{
            padding: '1.25rem 1rem 1rem',
            borderBottom: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <Bot size={28} color="#4f46e5" />
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e1b4b' }}>
                ArivuPro AI
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
              Powered by GPT-4o
            </p>
          </div>

          {/* New chat */}
          <div style={{ padding: '0.75rem' }}>
            <button onClick={clearChat} style={{
              width: '100%', padding: '0.6rem',
              background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
              color: '#fff', border: 'none', borderRadius: 8,
              fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            }}>
              <Sparkles size={16} /> New Chat
            </button>
          </div>

          {/* System preset */}
          <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>
              Mode
            </p>
            {SYSTEM_PRESETS.map(p => (
              <button key={p.id} onClick={() => setSystemPreset(p.id)} style={{
                width: '100%', textAlign: 'left', padding: '0.6rem 0.75rem',
                background: systemPreset === p.id ? '#eef2ff' : 'transparent',
                border: systemPreset === p.id ? '1px solid #c7d2fe' : '1px solid transparent',
                borderRadius: 8, cursor: 'pointer', marginBottom: '0.25rem',
                transition: 'all 0.15s',
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: systemPreset === p.id ? '#4f46e5' : '#374151', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {p.icon} {p.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 1 }}>{p.desc}</div>
              </button>
            ))}
            {systemPreset === 'custom' && (
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="Enter custom system prompt…"
                rows={4}
                style={{
                  width: '100%', boxSizing: 'border-box', marginTop: '0.5rem',
                  padding: '0.6rem', border: '1.5px solid #e2e8f0', borderRadius: 8,
                  fontSize: '0.78rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                }}
              />
            )}
          </div>

          {/* Suggested prompts */}
          <div style={{ padding: '0.5rem 0.75rem', flex: 1 }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.5rem 0 0.5rem' }}>
              Quick Prompts
            </p>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s.prompt)} style={{
                width: '100%', textAlign: 'left', padding: '0.55rem 0.75rem',
                background: 'transparent', border: '1px solid #f1f5f9', borderRadius: 8,
                cursor: 'pointer', marginBottom: '0.3rem', transition: 'all 0.15s',
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              }}
                onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>{s.icon}</span>
                <span style={{ fontSize: '0.78rem', color: '#374151', lineHeight: 1.4 }}>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Token counter */}
          {totalTokens > 0 && (
            <div style={{
              padding: '0.75rem', borderTop: '1px solid #f1f5f9',
              fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center',
            }}>
              <Hash size={14} /> {totalTokens.toLocaleString()} tokens used this session
            </div>
          )}
        </div>
      )}

      {/* ── Main chat area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem', background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={() => setShowSidebar(s => !s)} style={{
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
              padding: '0.4rem 0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: '#64748b',
            }}>
              {showSidebar ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e1b4b' }}>
                AI Assistant
              </h1>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                {SYSTEM_PRESETS.find(p => p.id === systemPreset)?.label} mode
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {messages.length > 0 && (
              <button onClick={clearChat} style={{
                background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444',
                borderRadius: 8, padding: '0.4rem 0.8rem', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: 600,
              }}>
                <Trash2 size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '1.25rem',
        }}>

          {/* Welcome state */}
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1rem',
                background: 'linear-gradient(135deg,#312e81,#4f46e5,#6d28d9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Bot size={40} color="#fff" /></div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e1b4b', margin: '0 0 0.5rem' }}>
                How can I help you today?
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: 400, margin: '0 auto 2rem' }}>
                I'm your AI assistant for CA/CS/CMA exam management. Ask me anything about exam analysis, question creation, or student performance.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.75rem', maxWidth: 640, margin: '0 auto' }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s.prompt)} style={{
                    padding: '0.85rem 1rem', background: '#fff',
                    border: '1.5px solid #e2e8f0', borderRadius: 12,
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#a5b4fc'; e.currentTarget.style.background = '#eef2ff'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}
                  >
                    <div style={{ display: 'flex', marginBottom: '0.5rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>{s.label}</div>
                    <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: 2, lineHeight: 1.4 }}>
                      {s.prompt.slice(0, 60)}…
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start', gap: '0.75rem',
            }}>
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg,#16a34a,#22c55e)'
                  : 'linear-gradient(135deg,#312e81,#4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', color: '#fff', fontWeight: 700,
              }}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>

              {/* Bubble */}
              <div style={{
                maxWidth: '75%', position: 'relative',
              }}>
                <div style={{
                  padding: '0.85rem 1rem',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg,#4f46e5,#6366f1)'
                    : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#1e293b',
                  borderRadius: msg.role === 'user'
                    ? '18px 4px 18px 18px'
                    : '4px 18px 18px 18px',
                  boxShadow: msg.role === 'user'
                    ? '0 2px 12px rgba(79,70,229,0.25)'
                    : '0 2px 8px rgba(0,0,0,0.06)',
                  border: msg.role === 'assistant' ? '1px solid #f1f5f9' : 'none',
                }}>
                  {msg.role === 'assistant'
                    ? <MessageContent text={msg.content} />
                    : <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.55 }}>{msg.content}</p>
                  }
                </div>

                {/* Copy button for AI messages */}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(msg.content, idx)}
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      background: copiedId === idx ? '#dcfce7' : '#f8fafc',
                      border: '1px solid #e2e8f0', borderRadius: 6,
                      padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem',
                      color: copiedId === idx ? '#16a34a' : '#94a3b8',
                      transition: 'all 0.2s',
                    }}
                  >
                    {copiedId === idx ? <><CheckCircle2 size={12} /> Copied</> : <><ClipboardList size={12} /> Copy</>}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg,#312e81,#4f46e5)',
              }}><Bot size={20} color="#fff" /></div>
              <div style={{
                padding: '0.85rem 1rem',
                background: '#fff', border: '1px solid #f1f5f9',
                borderRadius: '4px 18px 18px 18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                <TypingDots />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1.5px solid #fecaca',
              borderRadius: 10, padding: '0.85rem 1rem',
              color: '#991b1b', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <AlertTriangle size={18} /> {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input area ── */}
        <div style={{
          padding: '1rem 1.5rem', background: '#fff',
          borderTop: '1px solid #e2e8f0', flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', gap: '0.75rem', alignItems: 'flex-end',
            background: '#f8fafc', border: '1.5px solid #e2e8f0',
            borderRadius: 14, padding: '0.5rem 0.5rem 0.5rem 1rem',
            transition: 'border-color 0.2s',
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = '#4f46e5'}
            onBlurCapture={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about CA/CS/CMA exams… (Enter to send, Shift+Enter for new line)"
              rows={1}
              disabled={loading}
              style={{
                flex: 1, border: 'none', background: 'transparent', resize: 'none',
                outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit',
                color: '#1e293b', lineHeight: 1.6, maxHeight: 140, overflowY: 'auto',
                padding: '0.35rem 0',
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg,#4f46e5,#6366f1)'
                  : '#e2e8f0',
                border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', transition: 'all 0.2s',
                boxShadow: input.trim() ? '0 2px 8px rgba(79,70,229,0.3)' : 'none',
              }}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
            AI responses may not always be accurate. Verify important information independently.
          </p>
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '2px 0' }}>
      <style>{`
        @keyframes dot-bounce {
          0%,80%,100% { transform: translateY(0); opacity:.4 }
          40%          { transform: translateY(-5px); opacity:1 }
        }
      `}</style>
      {[0, 160, 320].map(delay => (
        <span key={delay} style={{
          width: 7, height: 7, borderRadius: '50%', background: '#94a3b8',
          display: 'inline-block',
          animation: `dot-bounce 1s ${delay}ms infinite`,
        }} />
      ))}
    </div>
  );
}
