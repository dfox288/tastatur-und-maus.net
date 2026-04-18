import { test, expect } from '@playwright/test';

test('EN homepage renders key content', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('h1')).toContainText('computer art');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('DE homepage renders key content', async ({ page }) => {
  await page.goto('/de/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});

test('countdown shows an integer', async ({ page }) => {
  await page.goto('/en/');
  const days = await page.locator('[data-countdown-days]').textContent();
  expect(days).toMatch(/^\d+$/);
  expect(parseInt(days!, 10)).toBeGreaterThan(0);
});

test('language toggle swaps prefix', async ({ page }) => {
  await page.goto('/en/imprint/');
  await page.getByRole('link', { name: /Switch to German/i }).click();
  await expect(page).toHaveURL(/\/de\/imprint\//);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  test('hamburger toggle reveals drawer links', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('label.mnav-btn').click();
    await expect(page.locator('.mnav-drawer a').first()).toBeVisible();
  });
});

test('no /index.html at dist root (nginx handles /)', async ({ request }) => {
  const res = await request.get('/');
  // astro preview serves 404 for unknown paths; this is the behavior we want
  expect([404, 301, 302]).toContain(res.status());
});
