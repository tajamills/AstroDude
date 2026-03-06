import { test, expect } from '@playwright/test';
import { dismissToasts, loginUser } from '../fixtures/helpers';

test.describe('Sticky Banner Ads', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginUser(page);
  });

  test('sticky banner ad displays on Dashboard', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('luck-score-card')).toBeVisible();
    const stickyAd = page.getByTestId('sticky-banner-ad');
    await expect(stickyAd).toBeVisible();
    // Verify it contains advertisement text
    await expect(stickyAd).toContainText('Advertisement');
  });

  test('sticky banner ad is fixed at the bottom on Dashboard', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const stickyAd = page.getByTestId('sticky-banner-ad');
    await expect(stickyAd).toBeVisible();
    const position = await stickyAd.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return { position: styles.position, bottom: styles.bottom };
    });
    expect(position.position).toBe('fixed');
    expect(position.bottom).toBe('0px');
  });

  test('sticky banner ad displays on History page', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
    const stickyAd = page.getByTestId('sticky-banner-ad');
    await expect(stickyAd).toBeVisible();
    await expect(stickyAd).toContainText('Advertisement');
  });

  test('sticky banner ad displays on Decode page', async ({ page }) => {
    await page.goto('/decode', { waitUntil: 'domcontentloaded' });
    const stickyAd = page.getByTestId('sticky-banner-ad');
    await expect(stickyAd).toBeVisible();
    await expect(stickyAd).toContainText('Advertisement');
  });
});

test.describe('In-Feed Ads in History', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    // Visit dashboard first to ensure scores are generated
    await loginUser(page);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('luck-score-card')).toBeVisible();
  });

  test('history page renders in-feed ad if 5+ history entries exist', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'domcontentloaded' });

    // Wait for history to load
    await expect(page.locator('[data-testid="stats-total-days"]')).toBeVisible();

    // Check total history count
    const totalDaysEl = page.locator('[data-testid="stats-total-days"] p.text-2xl');
    const totalText = await totalDaysEl.textContent().catch(() => '0');
    const totalDays = parseInt(totalText || '0', 10);

    if (totalDays >= 5) {
      // If 5+ history items exist, at least one in-feed ad should show at position 5
      await expect(page.getByTestId('in-feed-ad').first()).toBeVisible();
    } else {
      // Not enough entries to show in-feed ad — just verify none are shown
      const adCount = await page.getByTestId('in-feed-ad').count();
      expect(adCount).toBe(0);
    }
  });
});

test.describe('Decode Any Date Feature', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginUser(page);
  });

  test('navigate to Decode page from Dashboard via nav button', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('luck-score-card')).toBeVisible();
    const decodeBtn = page.getByTestId('nav-decode-btn');
    await expect(decodeBtn).toBeVisible();
    await decodeBtn.click({ force: true });
    await expect(page).toHaveURL(/decode/);
  });

  test('Decode page loads with date input and decode button', async ({ page }) => {
    await page.goto('/decode', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('decode-date-input')).toBeVisible();
    await expect(page.getByTestId('decode-btn')).toBeVisible();
    // Decode button should be disabled when no date selected
    await expect(page.getByTestId('decode-btn')).toBeDisabled();
  });

  test('Decode page shows preset date buttons', async ({ page }) => {
    await page.goto('/decode', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tomorrow' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next Week' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next Month' })).toBeVisible();
  });

  test('clicking Today preset fills date and enables decode button', async ({ page }) => {
    await page.goto('/decode', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Today' }).click({ force: true });
    // After clicking Today, date input should be filled
    const dateValue = await page.getByTestId('decode-date-input').inputValue();
    expect(dateValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Decode button should now be enabled
    await expect(page.getByTestId('decode-btn')).toBeEnabled();
  });

  test('decode a date shows result with score card', async ({ page }) => {
    await page.goto('/decode', { waitUntil: 'domcontentloaded' });
    // Fill a known date
    await page.getByTestId('decode-date-input').fill('2025-01-01');
    await expect(page.getByTestId('decode-btn')).toBeEnabled();
    await page.getByTestId('decode-btn').click({ force: true });
    // Wait for decoding to complete - look for score result
    await expect(page.locator('.glass-card').filter({ hasText: 'Day Officer' }).first()).toBeVisible({ timeout: 30000 });
  });

  test('decode result shows Day Officer, Business Day, Day Energy cards', async ({ page }) => {
    await page.goto('/decode', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('decode-date-input').fill('2025-06-15');
    await page.getByTestId('decode-btn').click({ force: true });
    // Check result sections appear
    await expect(page.getByText('Day Officer')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Business Day')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Day Energy')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Lucky Number')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Lucky Color')).toBeVisible({ timeout: 30000 });
  });

  test('decode result shows Good For and Avoid activity lists', async ({ page }) => {
    await page.goto('/decode', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('decode-date-input').fill('2025-03-20');
    await page.getByTestId('decode-btn').click({ force: true });
    await expect(page.getByText('Recommended Activities')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Good For')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Avoid')).toBeVisible({ timeout: 30000 });
  });

  test('back to dashboard from Decode page', async ({ page }) => {
    await page.goto('/decode', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('back-to-dashboard-btn').click({ force: true });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('direct URL /decode navigates correctly for authenticated user', async ({ page }) => {
    await page.goto('/decode', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/decode/);
    await expect(page.getByTestId('decode-date-input')).toBeVisible();
  });
});

test.describe('Silver/Platinum Theme', () => {
  test('dashboard nav has Decode button for silver theme layout', async ({ page }) => {
    await dismissToasts(page);
    await loginUser(page);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    // Check Decode button exists in nav
    await expect(page.getByTestId('nav-decode-btn')).toBeVisible();
  });

  test('cosmic-bg class is applied on Decode page', async ({ page }) => {
    await dismissToasts(page);
    await loginUser(page);
    await page.goto('/decode', { waitUntil: 'domcontentloaded' });
    // Verify main container has cosmic-bg
    const hasCosmic = await page.locator('.cosmic-bg').first().isVisible();
    expect(hasCosmic).toBe(true);
  });
});
