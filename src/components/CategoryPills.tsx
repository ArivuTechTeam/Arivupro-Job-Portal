import { useMemo } from 'react';
import { JobListing } from '../types/index.ts';

// Fixed categories — order matters (displayed left to right)
export const CATEGORIES: { key: string; label: string }[] = [
  { key: 'ca-articleship',     label: 'CA Articleship' },
  { key: 'cma-articleship',    label: 'CMA Articleship' },
  { key: 'cs-training',        label: 'CS Training' },
  { key: 'internship',         label: 'Internship' },
  { key: 'big4',               label: 'Big 4 Firms' },
  { key: 'fpa-finance',        label: 'FP&A / Finance' },
  { key: 'taxation',           label: 'Taxation / GST' },
  { key: 'audit',              label: 'Audit & Assurance' },
  { key: 'investment-banking', label: 'Investment Banking' },
  { key: 'compliance',         label: 'Compliance / Risk' },
  { key: 'acca-cfa',           label: 'ACCA / CFA / CPA' },
  { key: 'remote',             label: 'Remote' },
];

const BIG4 = ['deloitte', 'pwc', 'pricewaterhousecoopers', 'kpmg', 'ernst & young', 'ernst&young', 'grant thornton', 'bdo ', 'bdo india', 'rsm ', 'rsm india', 'mazars', 'bdo global'];
const BIG4_EXACT = (co: string) => co === 'ey' || co.startsWith('ey ') || co.startsWith('ey,') || co.includes(' ey ') || co.endsWith(' ey');

export function matchesCategory(j: JobListing, key: string): boolean {
  const t = (j.title + ' ' + (j.description || '')).toLowerCase();
  const co = j.company.toLowerCase();
  switch (key) {
    case 'ca-articleship':
      return /\b(ca|chartered accountant)\b.*\b(articleship|article|industrial train)\b|\b(articleship|article clerk|article assistant)\b.*\b(ca|icai)\b|\bicai\b/i.test(t)
        || (j.jobType === 'Articleship / Industrial Training' && j.qualifications?.some(q => ['CA', 'CA_INTER'].includes(q)));
    case 'cma-articleship':
      return /\b(cma|cost accountant|icmai)\b.*\b(articleship|training|practical)\b|\bcma articleship\b/i.test(t)
        || (j.jobType === 'Articleship / Industrial Training' && j.qualifications?.some(q => ['CMA_INDIA', 'US_CMA'].includes(q)));
    case 'cs-training':
      return /\b(company secretary|cs trainee|cs training|cs practical|icsi)\b/i.test(t)
        || j.qualifications?.includes('CS' as any);
    case 'big4':
      return BIG4.some(b => co.includes(b)) || BIG4_EXACT(co);
    case 'fpa-finance':
      return /\b(fp.?a|financial planning|financial analyst|corporate finance|budget analyst|cost accountant|management accountant)\b/i.test(t);
    case 'taxation':
      return /\b(tax|gst|tds|income tax|transfer pricing|direct tax|indirect tax)\b/i.test(t);
    case 'internship':
      return j.jobType === 'Internship';
    case 'remote':
      return j.workplaceType === 'Remote';
    case 'investment-banking':
      return /\b(investment bank|equity research|investment analyst|portfolio manager|ib analyst|m.?a|mergers|acquisitions)\b/i.test(t);
    case 'audit':
      return /\b(audit|statutory audit|internal audit|external audit|assurance|audit associate|audit assistant)\b/i.test(t)
        && !/articleship/i.test(t);
    case 'compliance':
      return /\b(compliance|risk management|regulatory|aml|kyc|rbi|sebi|company law)\b/i.test(t)
        && !/articleship/i.test(t);
    case 'acca-cfa':
      return /\b(acca|cfa|us cpa|cpa us|us cma|cfa analyst|cfa level)\b/i.test(t)
        || j.qualifications?.some(q => ['ACCA', 'CFA', 'US_CPA', 'US_CMA'].includes(q as string));
    default:
      return false;
  }
}

interface CategoryPillsProps {
  jobs: JobListing[];
  activeCategory: string;
  onSelect: (key: string) => void;
}

export function CategoryPills({ jobs, activeCategory, onSelect }: CategoryPillsProps) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      map[cat.key] = jobs.filter(j => matchesCategory(j, cat.key)).length;
    }
    return map;
  }, [jobs]);

  // Only show categories that have at least 1 job
  const visible = CATEGORIES.filter(c => counts[c.key] > 0);
  if (visible.length === 0) return null;

  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', overflowX: 'auto', scrollbarWidth: 'none' }}>
      <div style={{
        display: 'flex', gap: 8, padding: '12px 24px',
        maxWidth: 1180, margin: '0 auto',
        width: 'max-content', minWidth: '100%', boxSizing: 'border-box',
      }}>
        <button
          onClick={() => onSelect('')}
          style={{
            flexShrink: 0, padding: '6px 16px', borderRadius: 20, border: '1.5px solid',
            borderColor: activeCategory === '' ? '#1a7a4a' : '#e5e7eb',
            background: activeCategory === '' ? '#1a7a4a' : '#fff',
            color: activeCategory === '' ? '#fff' : '#374151',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
        >
          All jobs
        </button>

        {visible.map(cat => {
          const active = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => onSelect(active ? '' : cat.key)}
              style={{
                flexShrink: 0, padding: '6px 16px', borderRadius: 20, border: '1.5px solid',
                borderColor: active ? '#1a7a4a' : '#e5e7eb',
                background: active ? '#f0fdf4' : '#fff',
                color: active ? '#1a7a4a' : '#374151',
                fontSize: 13, fontWeight: active ? 700 : 500,
                cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {cat.label}
              <span style={{
                background: active ? '#1a7a4a' : '#f3f4f6',
                color: active ? '#fff' : '#6b7280',
                borderRadius: 10, padding: '1px 7px',
                fontSize: 11, fontWeight: 700,
              }}>
                {counts[cat.key]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
