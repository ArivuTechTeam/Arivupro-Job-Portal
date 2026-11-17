import { test } from '@playwright/test';

test('new job cards screenshot', async ({ page }) => {
  await page.goto('http://localhost:8000');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  // Scroll down to job cards
  await page.evaluate(() => document.getElementById('job-feed-anchor')?.scrollIntoView());
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'tests/screenshots/new_job_cards.png', fullPage: false });
});

test('footer screenshot', async ({ page }) => {
  await page.goto('http://localhost:8000');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tests/screenshots/new_footer.png', fullPage: false });
});

test('full page screenshot', async ({ page }) => {
  await page.goto('http://localhost:8000');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'tests/screenshots/full_page.png', fullPage: true });
});
