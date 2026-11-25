// Reuse shared icons from RecruiterNavIcons
export { DashboardIcon, JobPostsIcon, ProfileIcon } from './RecruiterNavIcons.tsx';

// Admin-specific solid 20×20 icons — paths copied exactly from admin_dashboard_redesign.html ICONS object
export function StudentsIcon() {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M10 2.8L1 7.3l9 4.5 7-3.5v4.9h1.6V7.3z" />
      <path d="M4.6 10.3v3.6c0 1.7 2.4 3.3 5.4 3.3s5.4-1.6 5.4-3.3v-3.6L10 13z" />
    </svg>
  );
}

export function RecruitersIcon() {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="currentColor" aria-hidden="true" focusable="false">
      <circle cx="10" cy="5.6" r="3.3" />
      <path fillRule="evenodd" d="M3.4 18c0-3.7 2.9-6.6 6.6-6.6s6.6 2.9 6.6 6.6zM10 12.6l1.1 1.3-.6 3.4h-1l-.6-3.4z" />
    </svg>
  );
}

export function CompaniesIcon() {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="currentColor" aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M4.5 2h7A1.5 1.5 0 0 1 13 3.5V18H3V3.5A1.5 1.5 0 0 1 4.5 2zm1 3v2h2V5zm3.5 0v2h2V5zM5.5 9v2h2V9zM9 9v2h2V9zm-1.8 5v4h1.6v-4z" />
      <path d="M14.2 8h2.3A1.5 1.5 0 0 1 18 9.5V18h-3.8z" />
    </svg>
  );
}

export function PlacementCrmIcon() {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="currentColor" aria-hidden="true" focusable="false">
      <rect x="2" y="3" width="4.4" height="14" rx="1.2" />
      <rect x="7.8" y="3" width="4.4" height="10" rx="1.2" />
      <rect x="13.6" y="3" width="4.4" height="6" rx="1.2" />
    </svg>
  );
}

export function ScraperIcon() {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M10 2.5a7.5 7.5 0 0 1 6.6 3.9l1.4-1V10h-4.6l1.6-1.2A5.6 5.6 0 0 0 4.4 10H2.5A7.5 7.5 0 0 1 10 2.5z" />
      <path d="M10 17.5a7.5 7.5 0 0 1-6.6-3.9l-1.4 1V10h4.6L5 11.2A5.6 5.6 0 0 0 15.6 10h1.9a7.5 7.5 0 0 1-7.5 7.5z" />
    </svg>
  );
}

export function SyncedJobsIcon() {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M10 2l8 4-8 4-8-4z" />
      <path d="M3.7 9.2L10 12.3l6.3-3.1L18 10l-8 4-8-4z" />
      <path d="M3.7 13.2L10 16.3l6.3-3.1L18 14l-8 4-8-4z" />
    </svg>
  );
}
