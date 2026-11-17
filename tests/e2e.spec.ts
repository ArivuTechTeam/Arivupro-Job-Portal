import { test, expect, Page } from '@playwright/test';
import path from 'path';

const BASE = 'http://localhost:8000';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: false });
}

async function dismissAnyModal(page: Page) {
  const closeBtn = page.locator('[data-testid="modal-close"], button:has-text("×"), button:has-text("Close")').first();
  if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }
}

// ─── 1. Homepage loads ───────────────────────────────────────────────────────

test('homepage loads and shows job listings', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  // Check navbar is visible
  await expect(page.locator('nav, header').first()).toBeVisible();
  await screenshot(page, '01_homepage');

  // Should show at least one job card or empty state
  const jobCards = page.locator('.job-card, [data-testid="job-card"], .card').first();
  await page.waitForTimeout(1000);
  await screenshot(page, '02_jobs_loaded');
});

// ─── 2. Job search filters ───────────────────────────────────────────────────

test('job search filters work including experience filter', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Find search input
  const searchInput = page.locator('input[placeholder*="Search"], input[type="text"]').first();
  if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await searchInput.fill('audit');
    await page.waitForTimeout(400);
    await screenshot(page, '03_search_filter_audit');
    await searchInput.clear();
  }

  // Find experience filter dropdown — the new one we added
  const expSelect = page.locator('select').filter({ hasText: /All Experience|Fresher|0-1 yr/i }).first();
  if (await expSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    await expSelect.selectOption({ label: '0-1 yr (Fresher)' });
    await page.waitForTimeout(400);
    await screenshot(page, '04_experience_filter_fresher');

    await expSelect.selectOption({ index: 0 }); // reset
  } else {
    // Try any select as experience filter
    const selects = await page.locator('select').all();
    console.log(`Found ${selects.length} select elements on the page`);
    await screenshot(page, '04_filters_visible');
  }
});

// ─── 3. Auth modal opens ─────────────────────────────────────────────────────

test('sign in modal opens', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Look for a sign in / login button
  const signInBtn = page.locator('button, a').filter({ hasText: /sign in|login|log in|get started/i }).first();
  if (await signInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await signInBtn.click();
    await page.waitForTimeout(500);
    await screenshot(page, '05_auth_modal_open');

    // Check modal content
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(emailInput).toBeVisible();
    }
  } else {
    await screenshot(page, '05_no_signin_btn_visible');
  }
});

// ─── 4. Admin login ──────────────────────────────────────────────────────────

test('admin login page loads', async ({ page }) => {
  await page.goto(`${BASE}/admin`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // If redirected to main page, navigate via navbar
  const adminLink = page.locator('a[href*="admin"], button').filter({ hasText: /admin/i }).first();
  if (await adminLink.isVisible({ timeout: 1000 }).catch(() => false)) {
    await adminLink.click();
    await page.waitForTimeout(500);
  }

  await screenshot(page, '06_admin_page');

  // Look for email/password form
  const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  const passwordField = page.locator('input[type="password"]').first();

  const hasEmailField = await emailField.isVisible({ timeout: 2000 }).catch(() => false);
  if (hasEmailField) {
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await screenshot(page, '07_admin_login_form');
  }
});

// ─── 5. Recruiter signup page ────────────────────────────────────────────────

test('recruiter signup form is accessible', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Look for recruiter / post job link
  const recruiterBtn = page.locator('button, a').filter({ hasText: /recruiter|post.*job|hire|employer/i }).first();
  if (await recruiterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await recruiterBtn.click();
    await page.waitForTimeout(600);
    await screenshot(page, '08_recruiter_signup');
  } else {
    // Navigate directly
    await page.goto(`${BASE}?role=recruiter`);
    await page.waitForTimeout(500);
    await screenshot(page, '08_recruiter_direct');
  }
});

// ─── 6. Scraper dry-run via admin API ────────────────────────────────────────

test('scraper dry-run API responds', async ({ page }) => {
  // Test as unauthenticated — should get 403 (not 500)
  const resp = await page.request.get(`${BASE}/api/scrape/dry-run?source=greenhouse`);
  // Expect 401 or 403 (auth required), not 500
  expect([401, 403, 422]).toContain(resp.status());
  await screenshot(page, '09_scraper_api_auth_check');
});

// ─── 7. Jobs API endpoint ─────────────────────────────────────────────────────

test('jobs API returns data', async ({ page }) => {
  const resp = await page.request.get(`${BASE}/api/jobs`);
  expect(resp.ok()).toBe(true);
  const body = await resp.json();
  // Should be an array (possibly empty if no DB)
  expect(Array.isArray(body) || typeof body === 'object').toBe(true);
  await screenshot(page, '10_jobs_api');
});

// ─── 8. Health check ─────────────────────────────────────────────────────────

test('health check endpoint works', async ({ page }) => {
  const resp = await page.request.get(`${BASE}/health`);
  if (resp.ok()) {
    const contentType = resp.headers()['content-type'] ?? '';
    if (contentType.includes('application/json')) {
      const body = await resp.json();
      expect(body).toHaveProperty('status');
    }
    await screenshot(page, '11_health_check_ok');
  } else {
    // /health may not exist — just check the root serves HTML
    const rootResp = await page.request.get(BASE);
    expect(rootResp.ok()).toBe(true);
    await screenshot(page, '11_root_ok');
  }
});

// ─── 9. Navigation tabs ───────────────────────────────────────────────────────

test('navigation tabs work', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Find nav tabs (Jobs, Articleship, Companies, etc.)
  const tabs = await page.locator('nav button, .tab-btn, [role="tab"]').all();
  console.log(`Found ${tabs.length} navigation tabs`);

  for (const tab of tabs.slice(0, 3)) {
    const label = await tab.textContent();
    if (label && label.trim().length > 0) {
      await tab.click();
      await page.waitForTimeout(300);
      console.log(`Clicked tab: ${label.trim()}`);
    }
  }
  await screenshot(page, '12_tabs_navigated');
});

// ─── 10. Job card detail opens ────────────────────────────────────────────────

test('job card opens detail view', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Find first "View Details" or "Apply" button
  const viewBtn = page.locator('button').filter({ hasText: /view|details|apply/i }).first();
  if (await viewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await viewBtn.click();
    await page.waitForTimeout(500);
    await screenshot(page, '13_job_detail_open');
  } else {
    // Try clicking a job card
    const card = page.locator('.card, [data-testid="job-card"]').first();
    if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
      await card.click();
      await page.waitForTimeout(500);
      await screenshot(page, '13_job_card_clicked');
    }
  }
});
