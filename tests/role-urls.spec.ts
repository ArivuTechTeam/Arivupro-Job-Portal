import { test, expect, Page } from '@playwright/test';

// Backend serves the built SPA on port 3000 (see main.py PORT env / uvicorn config).
// Playwright config baseURL is http://localhost:8000 (used by e2e.spec.ts against the
// production build). role-urls.spec.ts targets the running backend directly.
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

// Ensure sessionStorage is clean (guest) before each test
async function clearAuth(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.removeItem('ap_auth');
    sessionStorage.removeItem('ap_tab');
  });
}

// ─── Logged-out: /jobseeker ──────────────────────────────────────────────────

test('guest /jobseeker — shows student sign-in modal, page not blank', async ({ page }) => {
  await clearAuth(page);
  await page.goto(`${BASE}/jobseeker`);
  await page.waitForLoadState('networkidle');

  // Page body must have content (not blank)
  const body = page.locator('body');
  await expect(body).not.toBeEmpty();

  // Student login modal should be visible (contains "Login" or "Sign In" heading / button)
  const modal = page.locator('[role="dialog"], .modal, form').filter({ hasText: /sign in|log in|login/i }).first();
  await expect(modal).toBeVisible({ timeout: 5000 });
});

// ─── Logged-out: /recruiter ──────────────────────────────────────────────────

test('guest /recruiter — shows recruiter login/signup view, page not blank', async ({ page }) => {
  await clearAuth(page);
  await page.goto(`${BASE}/recruiter`);
  await page.waitForLoadState('networkidle');

  const body = page.locator('body');
  await expect(body).not.toBeEmpty();

  // Recruiter portal overlay should be visible — it contains "Recruit Finance Talent" or "Create Account"
  const portal = page.locator('div').filter({ hasText: /recruit finance talent|employer portal|create account/i }).first();
  await expect(portal).toBeVisible({ timeout: 5000 });
});

// ─── Logged-out: /admin ──────────────────────────────────────────────────────

test('guest /admin — shows admin login, page not blank', async ({ page }) => {
  await clearAuth(page);
  await page.goto(`${BASE}/admin`);
  await page.waitForLoadState('networkidle');

  const body = page.locator('body');
  await expect(body).not.toBeEmpty();

  // Admin login form should be present
  const adminLogin = page.locator('input[type="password"], form, [data-testid="admin-login"]').first();
  await expect(adminLogin).toBeVisible({ timeout: 5000 });
});

// ─── Logged-out: closing modal falls back to jobs tab / '/' ─────────────────

test('guest /jobseeker — closing modal without login goes to jobs tab', async ({ page }) => {
  await clearAuth(page);
  await page.goto(`${BASE}/jobseeker`);
  await page.waitForLoadState('networkidle');

  // Close the modal (press Escape or click a close button)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // URL should be '/' or '/jobs', not '/jobseeker'
  expect(page.url()).not.toContain('/jobseeker');
});
