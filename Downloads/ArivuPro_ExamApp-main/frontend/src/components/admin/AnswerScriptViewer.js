import React, { useState } from 'react';

export function resolveUrl(fileUrl) {
  if (!fileUrl) return null;
  if (fileUrl.startsWith('http')) return fileUrl;
  // Relative path — prepend the backend base URL
  const base = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace('/api', '');
  return `${base}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
}

// ── PDF / Image Viewer Modal ──────────────────────────────────────────────────
export function PDFViewerModal({ fileUrl, title, onClose }) {
  const [embedError, setEmbedError] = useState(false);

  const src     = resolveUrl(fileUrl);
  const isImage = fileUrl ? /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl) : false;

  if (!fileUrl || !src) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#1e1e2e', borderRadius: 12,
        width: '94vw', maxWidth: 1100, height: '94vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.75rem 1.25rem',
          background: '#2a2a3e', borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.1rem' }}>📄</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                {title || 'Answer Script'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', marginTop: 1 }}>
                {isImage ? 'Image file' : 'PDF Document'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <a href={src} download
              style={{
                padding: '0.4rem 1rem', borderRadius: 7,
                background: '#2563eb', color: '#fff',
                fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
              ⬇ Download
            </a>
            <a href={src} target="_blank" rel="noreferrer"
              style={{
                padding: '0.4rem 1rem', borderRadius: 7,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
              ↗ Open in Tab
            </a>
            <button onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', cursor: 'pointer', fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', background: '#525659', position: 'relative' }}>
          {isImage ? (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'auto', padding: '1rem',
            }}>
              <img
                src={src}
                alt={title || 'Answer Script'}
                style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 4 }}
              />
            </div>
          ) : embedError ? (
            /* Fallback when embed fails */
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.8)', textAlign: 'center', padding: '2rem',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
              <p style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: '0.5rem' }}>
                PDF preview not available in browser
              </p>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', marginBottom: '1.5rem' }}>
                Use the buttons above to download or open in a new tab.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a href={src} target="_blank" rel="noreferrer"
                  style={{
                    padding: '0.6rem 1.5rem', borderRadius: 9,
                    background: '#2563eb', color: '#fff',
                    fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
                  }}>
                  ↗ Open PDF in New Tab
                </a>
                <a href={src} download
                  style={{
                    padding: '0.6rem 1.5rem', borderRadius: 9,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: '#fff', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
                  }}>
                  ⬇ Download
                </a>
              </div>
            </div>
          ) : (
            /* embed works far better than iframe for cross-origin PDFs */
            <embed
              key={src}
              src={src}
              type="application/pdf"
              style={{ width: '100%', height: '100%', border: 'none' }}
              onError={() => setEmbedError(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Inline View + Download button pair ───────────────────────────────────────
export function ScriptPreviewBtn({ fileUrl, title, studentName }) {
  const [open, setOpen] = useState(false);
  if (!fileUrl) return <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>No file</span>;

  const resolved = resolveUrl(fileUrl);
  const isImg    = /\.(jpg|jpeg|png)$/i.test(fileUrl);
  const ext      = fileUrl.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setOpen(true)}
          style={{
            padding: '4px 12px', borderRadius: 6,
            background: '#eff6ff', border: '1px solid #bfdbfe',
            color: '#2563eb', fontWeight: 600, fontSize: '0.78rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <span>{isImg ? '🖼️' : '📄'}</span> View {ext}
        </button>
        <a
          href={resolved}
          download
          style={{
            padding: '4px 12px', borderRadius: 6,
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            color: '#16a34a', fontWeight: 600, fontSize: '0.78rem',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          ⬇ Download
        </a>
      </div>
      {open && (
        <PDFViewerModal
          fileUrl={fileUrl}
          title={title || `Answer Script — ${studentName || ''}`}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export default PDFViewerModal;
