// Inject global animation keyframes once — call injectAnimations() in App.tsx
let injected = false;

export function injectAnimations() {
  if (injected || typeof document === 'undefined') return;
  injected = true;

  const css = `
/* ── Fade + slide in ── */
@keyframes ap-fade-up {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ap-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes ap-fade-left {
  from { opacity: 0; transform: translateX(-18px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes ap-fade-right {
  from { opacity: 0; transform: translateX(18px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes ap-scale-in {
  from { opacity: 0; transform: scale(0.93); }
  to   { opacity: 1; transform: scale(1); }
}

/* ── Number count-up shimmer ── */
@keyframes ap-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* ── Pulse dot (live / active indicator) ── */
@keyframes ap-pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(1.5); }
}

/* ── Progress bar fill ── */
@keyframes ap-bar-fill {
  from { width: 0%; }
}

/* ── Gentle float (for stat cards, badges) ── */
@keyframes ap-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-5px); }
}

/* ── Slide-down (navbar, dropdowns) ── */
@keyframes ap-slide-down {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Modal pop ── */
@keyframes ap-modal-pop {
  from { opacity: 0; transform: scale(0.95) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* ── Stagger utility classes ── */
.ap-fade-up   { animation: ap-fade-up   0.45s cubic-bezier(.22,.68,0,1.2) both; }
.ap-fade-in   { animation: ap-fade-in   0.35s ease both; }
.ap-fade-left { animation: ap-fade-left 0.4s cubic-bezier(.22,.68,0,1.1) both; }
.ap-fade-right{ animation: ap-fade-right 0.4s cubic-bezier(.22,.68,0,1.1) both; }
.ap-scale-in  { animation: ap-scale-in  0.35s cubic-bezier(.22,.68,0,1.2) both; }
.ap-modal-pop { animation: ap-modal-pop 0.32s cubic-bezier(.22,.68,0,1.2) both; }
.ap-slide-down{ animation: ap-slide-down 0.28s ease both; }

/* stagger delays */
.ap-d0  { animation-delay: 0ms; }
.ap-d1  { animation-delay: 60ms; }
.ap-d2  { animation-delay: 120ms; }
.ap-d3  { animation-delay: 180ms; }
.ap-d4  { animation-delay: 240ms; }
.ap-d5  { animation-delay: 300ms; }
.ap-d6  { animation-delay: 360ms; }
.ap-d7  { animation-delay: 420ms; }
.ap-d8  { animation-delay: 480ms; }

/* ── Card hover lift ── */
.ap-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  will-change: transform;
}
.ap-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(15,36,25,0.12) !important;
}

/* ── Button press ── */
.ap-btn {
  transition: transform 0.12s ease, opacity 0.12s ease;
}
.ap-btn:hover  { opacity: 0.88; }
.ap-btn:active { transform: scale(0.97); }

/* ── Pulse dot ── */
.ap-dot-live {
  display: inline-block;
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #22c55e;
  animation: ap-pulse-dot 1.6s ease-in-out infinite;
}

/* ── Progress bar animated fill ── */
.ap-bar-fill {
  animation: ap-bar-fill 1s cubic-bezier(.22,.68,0,1.1) both;
}

/* ── Stat float ── */
.ap-stat-float {
  animation: ap-float 4s ease-in-out infinite;
}

/* ── Shimmer skeleton ── */
.ap-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ap-shimmer 1.4s infinite;
  border-radius: 6px;
}
`;

  const el = document.createElement('style');
  el.id = 'arivupro-animations';
  el.textContent = css;
  document.head.appendChild(el);
}
