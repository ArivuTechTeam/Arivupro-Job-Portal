/**
 * PromoSlot — contextual ArivuPro course promotion cards.
 *
 * Usage:
 *   <PromoSlot placement="job_detail_sidebar" context={{ qualifications: ['CA'], jobType: 'Articleship / Industrial Training', city: 'Bengaluru' }} />
 *
 * Fetches /api/batches once per session (cached in module-level promise).
 * pickPromo() is a pure function — easy to unit test.
 */

import { useEffect, useState } from 'react';
import { X, Calendar, MapPin, ArrowRight, GraduationCap } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────

interface Batch {
  course: string;
  level: string | null;
  city: string | null;
  start_date: string;      // ISO "YYYY-MM-DD"
  schedule: string | null;
  course_url: string | null;
}

export interface PromoContext {
  qualifications?: string[];   // e.g. ['CA', 'ACCA']
  jobType?: string;            // e.g. 'Articleship / Industrial Training'
  city?: string;
  department?: string;
  title?: string;
  description?: string;
}

type Placement =
  | 'job_detail_sidebar'
  | 'job_detail_after_apply'
  | 'articleship_header'
  | 'feed_inline'
  | 'empty_state';

// ── Static promo definitions ───────────────────────────────────────────────

interface PromoDefinition {
  key: string;
  title: string;
  body: string;
  cta: string;
  ctaUrl: string;
  secondaryCta?: { label: string; url: string };
  course: string;             // matches Batch.course for date lookup
  matchFn: (ctx: PromoContext) => boolean;
  placements: Placement[];
  variant: 'card' | 'strip' | 'compact';
}

const PROMOS: PromoDefinition[] = [
  {
    key: 'ca-final-free',
    course: 'CA',
    title: 'Doing articleship? Start CA Final now',
    body: 'Free recorded CA Final lectures — learn at your own pace alongside your articleship.',
    cta: 'Try free lectures',
    ctaUrl: 'https://online.arivupro.com/learn/CA-Final-Online-Video-lecture-classes-for-free?utm_source=careers_portal&utm_medium=job_detail_sidebar&utm_campaign=ca-final-free',
    secondaryCta: { label: 'Talk to a counsellor', url: 'https://www.arivupro.com/ca-coaching-classes-institute-center-in-india#counseling-form?utm_source=careers_portal&utm_medium=job_detail_sidebar&utm_campaign=ca-final-free' },
    matchFn: (ctx) =>
      !!(ctx.jobType?.includes('Articleship')) ||
      !!(ctx.qualifications?.includes('CA')),
    placements: ['job_detail_sidebar', 'articleship_header'],
    variant: 'card',
  },
  {
    key: 'acca-exemption',
    course: 'ACCA',
    title: 'Big 4 job? ACCA opens global doors',
    body: 'Check how many ACCA papers you\'re exempt from — CA/B.Com holders get up to 9 exemptions.',
    cta: 'Check my exemptions',
    ctaUrl: 'https://www.arivupro.com/acca-exemption-calculator?utm_source=careers_portal&utm_medium=job_detail_sidebar&utm_campaign=acca-exemption',
    matchFn: (ctx) => {
      const text = `${ctx.title || ''} ${ctx.description || ''}`.toLowerCase();
      return !!(ctx.qualifications?.includes('ACCA')) ||
        /\b(acca|ifrs|big 4|global|international audit)\b/.test(text);
    },
    placements: ['job_detail_sidebar'],
    variant: 'card',
  },
  {
    key: 'cma-usa',
    course: 'CMA USA',
    title: 'FP&A role? CMA USA is the global edge',
    body: 'IMA Silver Learning Partner. CMA USA holders earn 40% more in MNC finance roles.',
    cta: 'Get batch details',
    ctaUrl: 'https://www.arivupro.com/us-cma-course-in-india?utm_source=careers_portal&utm_medium=job_detail_sidebar&utm_campaign=cma-usa',
    matchFn: (ctx) => {
      const text = `${ctx.title || ''} ${ctx.description || ''}`.toLowerCase();
      return !!(ctx.qualifications?.includes('US CMA')) ||
        /\b(fp.?a|financial planning|us gaap|mnc finance|gcc|management account)\b/.test(text);
    },
    placements: ['job_detail_sidebar'],
    variant: 'card',
  },
  {
    key: 'cs-batch',
    course: 'CS',
    title: 'CS training opening? Enrol in CS coaching',
    body: 'AIR 3 & AIR 7 results. CS Executive and Professional batches — classroom + online.',
    cta: 'Enquire now',
    ctaUrl: 'https://www.arivupro.com/best-cs-coaching-classes-institute-center-in-india?utm_source=careers_portal&utm_medium=job_detail_sidebar&utm_campaign=cs-batch',
    matchFn: (ctx) => {
      const text = `${ctx.title || ''} ${ctx.description || ''}`.toLowerCase();
      return !!(ctx.qualifications?.includes('CS')) ||
        /\b(company secretary|cs executive|cs trainee|icsi)\b/.test(text);
    },
    placements: ['job_detail_sidebar'],
    variant: 'card',
  },
  {
    key: 'cfa-ib',
    course: 'CFA',
    title: 'Investment role? CFA is the gold standard',
    body: 'CFA prep with ArivuPro — equity research, IB, portfolio management careers.',
    cta: 'Enquire now',
    ctaUrl: 'https://www.arivupro.com/cfa-course-in-india?utm_source=careers_portal&utm_medium=job_detail_sidebar&utm_campaign=cfa-ib',
    matchFn: (ctx) => {
      const text = `${ctx.title || ''} ${ctx.description || ''}`.toLowerCase();
      return !!(ctx.qualifications?.includes('CFA')) ||
        /\b(cfa|investment bank|equity research|portfolio|valuation|ib analyst)\b/.test(text);
    },
    placements: ['job_detail_sidebar'],
    variant: 'card',
  },
  {
    key: 'counselling-default',
    course: '',
    title: 'Not sure which course fits this role?',
    body: 'Free 1-on-1 career counselling with an ArivuPro expert — no sales pitch.',
    cta: 'Book free session',
    ctaUrl: 'https://www.arivupro.com/ca-coaching-classes-institute-center-in-india#counseling-form?utm_source=careers_portal&utm_medium=job_detail_sidebar&utm_campaign=counselling-default',
    matchFn: () => true,  // fallback — always matches
    placements: ['job_detail_sidebar', 'empty_state'],
    variant: 'compact',
  },
  {
    key: 'articleship-strip',
    course: 'CA',
    title: 'Doing articleship? Prepare CA Final alongside — free lectures available',
    body: '',
    cta: 'Start free →',
    ctaUrl: 'https://online.arivupro.com/learn/CA-Final-Online-Video-lecture-classes-for-free?utm_source=careers_portal&utm_medium=articleship_header&utm_campaign=articleship-strip',
    matchFn: () => true,
    placements: ['articleship_header'],
    variant: 'strip',
  },
];

// ── Batch date fetch (cached per session) ──────────────────────────────────

let _batchCache: Promise<Batch[]> | null = null;

function fetchBatches(): Promise<Batch[]> {
  if (!_batchCache) {
    _batchCache = fetch('/api/batches')
      .then(r => r.ok ? r.json() : { batches: [] })
      .then(d => d.batches || [])
      .catch(() => []);
  }
  return _batchCache;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function nearestBatch(batches: Batch[], course: string, city?: string): Batch | null {
  if (!course) return null;
  const matches = batches.filter(b => b.course === course);
  if (!matches.length) return null;
  // prefer city match, fall back to any
  const cityMatch = city ? matches.find(b => b.city?.toLowerCase().includes(city.toLowerCase())) : null;
  return cityMatch || matches[0];
}

// ── pickPromo — pure, exported for tests ───────────────────────────────────

export function pickPromo(placement: Placement, ctx: PromoContext): PromoDefinition | null {
  const candidates = PROMOS.filter(p =>
    p.placements.includes(placement) && p.key !== 'counselling-default' && p.matchFn(ctx)
  );
  if (candidates.length) return candidates[0];
  // fallback
  const fallback = PROMOS.find(p => p.placements.includes(placement) && p.key === 'counselling-default');
  return fallback || null;
}

// ── Dismiss helpers (localStorage, 7-day cooldown) ────────────────────────

function isDismissed(key: string): boolean {
  try {
    const raw = localStorage.getItem(`promo_dismissed_${key}`);
    if (!raw) return false;
    return Date.now() - parseInt(raw) < 7 * 86400 * 1000;
  } catch { return false; }
}

function dismiss(key: string) {
  try { localStorage.setItem(`promo_dismissed_${key}`, String(Date.now())); } catch { /* ignore */ }
}

// ── Promo card variants ────────────────────────────────────────────────────

function CardVariant({ promo, batch, onDismiss }: { promo: PromoDefinition; batch: Batch | null; onDismiss: () => void }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)',
      border: '1.5px solid #bbf7d0',
      borderRadius: 14,
      padding: '18px 18px 16px',
      position: 'relative',
      fontFamily: 'Manrope, sans-serif',
    }}>
      {/* Label + close */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#1a7a4a', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#dcfce7', padding: '2px 8px', borderRadius: 6 }}>
          From ArivuPro Academy
        </span>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2, lineHeight: 1 }}>
          <X size={13} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#1a7a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <GraduationCap size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0f2419', lineHeight: 1.35, marginBottom: 4 }}>{promo.title}</div>
          {promo.body && <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{promo.body}</div>}
        </div>
      </div>

      {/* Batch date if available */}
      {batch && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, padding: '8px 10px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar size={12} color="#1a7a4a" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0f2419' }}>{formatDate(batch.start_date)}</span>
          </div>
          {batch.city && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={12} color="#6b7280" />
              <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{batch.city}</span>
            </div>
          )}
        </div>
      )}

      <a
        href={promo.ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          width: '100%', padding: '9px 0', borderRadius: 9,
          background: '#1a7a4a', color: '#fff',
          fontSize: 12, fontWeight: 800, textDecoration: 'none',
          boxSizing: 'border-box',
        }}
      >
        {promo.cta} <ArrowRight size={13} />
      </a>

      {promo.secondaryCta && (
        <a
          href={promo.secondaryCta.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 11, fontWeight: 700, color: '#1a7a4a', textDecoration: 'none' }}
        >
          {promo.secondaryCta.label}
        </a>
      )}
    </div>
  );
}

function CompactVariant({ promo, onDismiss }: { promo: PromoDefinition; onDismiss: () => void }) {
  return (
    <div style={{
      background: '#f8fffe', border: '1px solid #d1fae5', borderRadius: 12,
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: 'Manrope, sans-serif',
    }}>
      <GraduationCap size={16} color="#1a7a4a" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2419', marginBottom: 1 }}>{promo.title}</div>
        <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>From ArivuPro Academy</span>
      </div>
      <a
        href={promo.ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 11, fontWeight: 800, color: '#1a7a4a', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
      >
        {promo.cta} →
      </a>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, flexShrink: 0 }}>
        <X size={12} />
      </button>
    </div>
  );
}

function StripVariant({ promo, batch }: { promo: PromoDefinition; batch: Batch | null }) {
  return (
    <div style={{
      background: 'linear-gradient(90deg, #0f2419 0%, #1a7a4a 100%)',
      padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 16,
      flexWrap: 'wrap', fontFamily: 'Manrope, sans-serif',
    }}>
      <GraduationCap size={16} color="#86efac" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', flex: 1 }}>{promo.title}</span>
      {batch && (
        <span style={{ fontSize: 12, color: '#86efac', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={11} /> Next batch: {formatDate(batch.start_date)}{batch.city ? ` · ${batch.city}` : ''}
        </span>
      )}
      <a
        href={promo.ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 12, fontWeight: 800, color: '#fede6d', textDecoration: 'none', whiteSpace: 'nowrap' }}
      >
        {promo.cta}
      </a>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>From ArivuPro Academy</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

interface PromoSlotProps {
  placement: Placement;
  context: PromoContext;
}

export function PromoSlot({ placement, context }: PromoSlotProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchBatches().then(setBatches);
  }, []);

  const promo = pickPromo(placement, context);
  if (!promo || dismissed || isDismissed(promo.key)) return null;

  const batch = nearestBatch(batches, promo.course, context.city);

  const handleDismiss = () => {
    dismiss(promo.key);
    setDismissed(true);
  };

  if (promo.variant === 'strip') return <StripVariant promo={promo} batch={batch} />;
  if (promo.variant === 'compact') return <CompactVariant promo={promo} onDismiss={handleDismiss} />;
  return <CardVariant promo={promo} batch={batch} onDismiss={handleDismiss} />;
}
