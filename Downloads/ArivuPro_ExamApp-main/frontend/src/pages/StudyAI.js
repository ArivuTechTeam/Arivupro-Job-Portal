import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Settings,
  Bot, 
  FileText, 
  Paperclip, 
  Send, 
  X, 
  Plus, 
  Trash2, 
  User, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';
import { studyAI } from '../services/api';

const SECTIONS = ['summary', 'key_concepts', 'section_breakdown', 'flashcards'];

function AnalysisCard({ doc }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [flipped, setFlipped] = useState({});
  const kp = doc.key_points || {};
  const keyConcepts = kp.key_concepts || [];
  const sections = kp.section_breakdown || [];
  const flashcards = kp.flashcards || [];

  const tabs = [
    { key: 'summary', label: 'Summary' },
    { key: 'key_concepts', label: 'Key Concepts' },
    { key: 'section_breakdown', label: 'Breakdown' },
    { key: 'flashcards', label: 'Flashcards' },
  ];

  return (
    <div style={{ background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden', maxWidth: '100%' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#fff', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            background: 'none', border: 'none', padding: '0.6rem 1.1rem',
            fontWeight: activeTab === t.key ? 700 : 500,
            color: activeTab === t.key ? '#16a34a' : '#64748b',
            borderBottom: activeTab === t.key ? '2px solid #16a34a' : '2px solid transparent',
            cursor: 'pointer', fontSize: '0.82rem', whiteSpace: 'nowrap', marginBottom: '-1px',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '1rem' }}>
        {/* Smart-analysis notice when AI not configured */}
        {doc.ai_summary && (
          doc.ai_summary.toLowerCase().includes('unavailable') ||
          doc.ai_summary.toLowerCase().includes('api key')
        ) && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a',
            borderLeft: '4px solid #f59e0b', borderRadius: 10,
            padding: '0.75rem 1rem', marginBottom: '0.875rem',
            fontSize: '0.78rem', color: '#92400e',
            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
          }}>
            <AlertCircle size={18} />
            <span>
              <strong>AI API not configured.</strong> Add{' '}
              <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: 4 }}>
                ANTHROPIC_API_KEY
              </code>{' '}
              or{' '}
              <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: 4 }}>
                OPENAI_API_KEY
              </code>{' '}
              to your <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: 4 }}>.env</code>{' '}
              file and restart Django for full AI-powered analysis.
            </span>
          </div>
        )}
        {activeTab === 'summary' && (
          <p style={{ margin: 0, lineHeight: '1.8', color: '#374151', fontSize: '0.9rem' }}>
            {doc.ai_summary && !doc.ai_summary.toLowerCase().includes('unavailable')
              ? doc.ai_summary
              : doc.key_points?.extracted_text
                ? doc.key_points.extracted_text.slice(0, 600) + '…'
                : 'No summary available.'}
          </p>
        )}

        {activeTab === 'key_concepts' && (
          keyConcepts.length === 0
            ? <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No key concepts extracted.</p>
            : <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {keyConcepts.map((c, i) => (
                  <span key={i} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 500 }}>
                    {c}
                  </span>
                ))}
              </div>
        )}

        {activeTab === 'section_breakdown' && (
          sections.length === 0
            ? <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No breakdown available.</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sections.map((s, i) => (
                  <div key={i} style={{ borderLeft: '3px solid #16a34a', paddingLeft: '0.75rem' }}>
                    <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{s.title}</p>
                    <p style={{ margin: 0, color: '#475569', lineHeight: '1.7', fontSize: '0.85rem' }}>{s.explanation}</p>
                  </div>
                ))}
              </div>
        )}

        {activeTab === 'flashcards' && (
          flashcards.length === 0
            ? <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No flashcards generated.</p>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                {flashcards.map((card, i) => (
                  <div key={i} onClick={() => setFlipped(p => ({ ...p, [i]: !p[i] }))} style={{
                    cursor: 'pointer', minHeight: '110px', borderRadius: '0.6rem',
                    padding: '1rem', border: '1px solid', userSelect: 'none',
                    background: flipped[i] ? '#f0fdf4' : '#fff',
                    borderColor: flipped[i] ? '#bbf7d0' : '#e2e8f0',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: flipped[i] ? '#16a34a' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                        {flipped[i] ? 'Answer' : 'Question'}
                      </div>
                      <p style={{ margin: 0, color: '#1e293b', fontSize: '0.85rem', lineHeight: '1.6' }}>
                        {flipped[i] ? card.answer : card.question}
                      </p>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'right', marginTop: '0.5rem' }}>
                      {flipped[i] ? 'Tap for question' : 'Tap to reveal'}
                    </div>
                  </div>
                ))}
              </div>
        )}
      </div>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      {/* Avatar */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
        background: isUser ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.8rem', color: '#fff', fontWeight: 700,
      }}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '78%',
        background: isUser ? 'linear-gradient(135deg,#16a34a,#15803d)' : '#fff',
        color: isUser ? '#fff' : '#1e293b',
        borderRadius: isUser ? '1rem 0.25rem 1rem 1rem' : '0.25rem 1rem 1rem 1rem',
        padding: '0.75rem 1rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        border: isUser ? 'none' : '1px solid #e2e8f0',
        fontSize: '0.9rem', lineHeight: '1.7',
      }}>
        {msg.type === 'analysis' ? (
          <div>
            <p style={{ margin: '0 0 0.75rem', fontWeight: 600 }}>
              I've analyzed your document. Here's what I found:
            </p>
            <AnalysisCard doc={msg.doc} />
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              You can ask me anything about this document below.
            </p>
          </div>
        ) : msg.type === 'uploading' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
            <div className="spinner" style={{ width: '16px', height: '16px' }} />
            Analyzing your PDF with AI...
          </div>
        ) : msg.type === 'error' ? (
          <span style={{ color: '#dc2626' }}>{msg.text}</span>
        ) : (
          <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
        )}
      </div>
    </div>
  );
}

export default function StudyAI() {
  const [docs, setDocs] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);
  const [messages, setMessages] = useState({});   // docId → [{role, text, type}]
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();
  const bottomRef = useRef();
  const inputRef = useRef();

  const activeDoc = docs.find(d => d.id === activeDocId) || null;
  const activeMessages = (activeDocId && messages[activeDocId]) || [];

  useEffect(() => {
    studyAI.list()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data.results || []);
        setDocs(list);
        if (list.length > 0) setActiveDocId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setSidebarLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // When switching to a doc that has no messages yet but is completed, show analysis
  useEffect(() => {
    if (!activeDocId) return;
    const doc = docs.find(d => d.id === activeDocId);
    if (!doc || doc.status !== 'completed') return;
    if (messages[activeDocId]?.length > 0) return;
    setMessages(prev => ({
      ...prev,
      [activeDocId]: [{ role: 'ai', type: 'analysis', doc }],
    }));
  }, [activeDocId, docs]);

  const addMsg = useCallback((docId, msg) => {
    setMessages(prev => ({
      ...prev,
      [docId]: [...(prev[docId] || []), msg],
    }));
  }, []);

  const handleUploadFile = async (file) => {
    if (!file || file.type !== 'application/pdf') return;
    setShowUpload(false);

    const tempId = `temp-${Date.now()}`;
    const tempDoc = { id: tempId, title: file.name.replace(/\.pdf$/i, ''), status: 'processing' };
    setDocs(prev => [tempDoc, ...prev]);
    setActiveDocId(tempId);
    setMessages(prev => ({
      ...prev,
      [tempId]: [{ role: 'user', type: 'text', text: `Analyze this document: ${file.name}` },
                 { role: 'ai', type: 'uploading' }],
    }));

    try {
      const fd = new FormData();
      fd.append('pdf_file', file);
      fd.append('title', file.name.replace(/\.pdf$/i, ''));
      const { data: doc } = await studyAI.upload(fd);

      setDocs(prev => prev.map(d => d.id === tempId ? doc : d));
      setActiveDocId(doc.id);
      setMessages(prev => {
        const updated = { ...prev };
        const old = updated[tempId] || [];
        delete updated[tempId];
        updated[doc.id] = [
          old[0],
          doc.status === 'completed'
            ? { role: 'ai', type: 'analysis', doc }
            : { role: 'ai', type: 'error', text: doc.ai_summary || 'Analysis failed. Please try again.' },
        ];
        return updated;
      });
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.pdf_file?.[0] || `Upload failed (${err.response?.status || 'network error'})`;
      setMessages(prev => ({
        ...prev,
        [tempId]: [...(prev[tempId] || []).slice(0, 1), { role: 'ai', type: 'error', text: msg }],
      }));
    }
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || !activeDocId || loading) return;
    if (!activeDoc || activeDoc.status !== 'completed') return;
    setInput('');
    setLoading(true);
    addMsg(activeDocId, { role: 'user', type: 'text', text: q });
    addMsg(activeDocId, { role: 'ai', type: 'uploading' });

    try {
      const { data } = await studyAI.chat(activeDocId, q);
      setMessages(prev => {
        const msgs = [...(prev[activeDocId] || [])];
        msgs[msgs.length - 1] = { role: 'ai', type: 'text', text: data.answer };
        return { ...prev, [activeDocId]: msgs };
      });
    } catch {
      setMessages(prev => {
        const msgs = [...(prev[activeDocId] || [])];
        msgs[msgs.length - 1] = { role: 'ai', type: 'error', text: 'Could not get a response. Please try again.' };
        return { ...prev, [activeDocId]: msgs };
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleDelete = async (docId, e) => {
    e.stopPropagation();
    try {
      await studyAI.delete(docId);
      setDocs(prev => {
        const next = prev.filter(d => d.id !== docId);
        if (activeDocId === docId) setActiveDocId(next[0]?.id || null);
        return next;
      });
      setMessages(prev => { const n = { ...prev }; delete n[docId]; return n; });
    } catch {}
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 2rem)', maxHeight: '820px', background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

      {/* ── Sidebar ── */}
      <div style={{ width: '240px', flexShrink: 0, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setShowUpload(true)}
            style={{ width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.65rem 0.75rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <Plus size={18} /> New Document
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {sidebarLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" /></div>
          ) : docs.length === 0 ? (
            <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
              No documents yet.<br />Upload a PDF to start.
            </div>
          ) : docs.map(doc => (
            <div
              key={doc.id}
              onClick={() => setActiveDocId(doc.id)}
              style={{
                padding: '0.65rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer',
                background: activeDocId === doc.id ? '#fff' : 'transparent',
                boxShadow: activeDocId === doc.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                border: activeDocId === doc.id ? '1px solid #e2e8f0' : '1px solid transparent',
                marginBottom: '0.25rem', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.title || 'Document'}
                </div>
                <div style={{ fontSize: '0.7rem', color: doc.status === 'completed' ? '#16a34a' : doc.status === 'failed' ? '#dc2626' : '#f59e0b', marginTop: '0.15rem' }}>
                  {doc.status === 'completed' ? 'Ready' : doc.status === 'failed' ? 'Failed' : 'Processing...'}
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(doc.id, e)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem', padding: '0.1rem 0.25rem', borderRadius: '0.25rem', flexShrink: 0 }}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#fff' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Study AI</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {activeDoc ? activeDoc.title || 'Document' : 'Upload a PDF to start'}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#fafafa' }}>
          {!activeDocId && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
              <FileText size={48} />
              <p style={{ fontWeight: 600, fontSize: '1.05rem', color: '#374151', marginBottom: '0.5rem' }}>Upload a PDF to get started</p>
              <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>AI will explain everything — key concepts, summaries, flashcards, and answer your questions.</p>
              <button
                onClick={() => setShowUpload(true)}
                style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.75rem 1.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Upload PDF
              </button>
            </div>
          )}

          {activeMessages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        {activeDocId && (
          <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', background: '#f1f5f9', borderRadius: '0.75rem', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setShowUpload(true)}
                title="Upload new PDF"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.2rem', padding: '0.25rem', flexShrink: 0, lineHeight: 1 }}
              >
                <Paperclip size={20} />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={activeDoc?.status === 'completed' ? 'Ask anything about this document...' : 'Waiting for analysis to complete...'}
                disabled={loading || activeDoc?.status !== 'completed'}
                rows={1}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none',
                  fontSize: '0.9rem', color: '#1e293b', lineHeight: '1.5', padding: '0.2rem 0',
                  fontFamily: 'inherit', maxHeight: '120px', overflowY: 'auto',
                }}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim() || activeDoc?.status !== 'completed'}
                style={{
                  background: loading || !input.trim() || activeDoc?.status !== 'completed' ? '#cbd5e1' : '#16a34a',
                  border: 'none', color: '#fff', width: '34px', height: '34px', borderRadius: '0.5rem',
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem',
                }}
              >
                <Send size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.4rem' }}>
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        )}
      </div>

      {/* ── Upload Modal ── */}
      {showUpload && (
        <div
          onClick={() => setShowUpload(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', width: '420px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Upload a PDF Document</h3>
              <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              onDrop={e => { e.preventDefault(); setDragging(false); handleUploadFile(e.dataTransfer.files[0]); }}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              style={{
                border: `2px dashed ${dragging ? '#16a34a' : '#cbd5e1'}`,
                borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center',
                cursor: 'pointer', background: dragging ? '#f0fdf4' : '#f8fafc',
                transition: 'all 0.2s',
              }}
            >
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { handleUploadFile(e.target.files[0]); e.target.value = ''; }} />
              <FileText size={48} color="#cbd5e1" />
              <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>Drop PDF here or click to browse</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>PDF files up to 50MB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
