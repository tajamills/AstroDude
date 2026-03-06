import { test, expect } from '@playwright/test';
import { dismissToasts, loginUser } from '../fixtures/helpers';

test.describe('8-Step Onboarding Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.removeItem('astro_token');
      localStorage.removeItem('astro_user');
    });
  });

  test('onboarding flow: complete all steps and reach dashboard', async ({ page }) => {
    // Register a new user to get a clean onboarding state
    const uniqueId = Date.now();
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('register-name-input').fill(`OB_User_${uniqueId}`);
    await page.getByTestId('register-email-input').fill(`ob_${uniqueId}@testreg.com`);
    await page.getByTestId('register-password-input').fill('password123');
    await page.getByTestId('register-submit-btn').click();
    await expect(page).toHaveURL(/onboarding/, { timeout: 15000 });

    // Step 0: Welcome - select goal
    await expect(page.getByTestId('goal-career')).toBeVisible();
    await page.getByTestId('goal-career').click();
    await expect(page.getByTestId('onboarding-next-btn')).toBeVisible();
    await page.getByTestId('onboarding-next-btn').click();

    // Step 1: Birth info
    await expect(page.getByTestId('birth-date-input')).toBeVisible();
    await page.getByTestId('birth-date-input').fill('1990-05-15');
    await page.getByTestId('onboarding-next-btn').click();

    // Step 2: Location
    await expect(page.getByTestId('birth-location-input')).toBeVisible();
    await page.getByTestId('birth-location-input').fill('New York, USA');
    await page.getByTestId('onboarding-next-btn').click();

    // Step 3: Career interests
    await expect(page.getByTestId('career-entrepreneur')).toBeVisible();
    await page.getByTestId('career-entrepreneur').click();
    await page.getByTestId('onboarding-next-btn').click();

    // Step 4: Life focus
    await expect(page.getByTestId('focus-career_path')).toBeVisible();
    await page.getByTestId('focus-career_path').click();
    await page.getByTestId('onboarding-next-btn').click();

    // Step 5: Partner (no)
    await expect(page.getByTestId('partner-no')).toBeVisible();
    await page.getByTestId('partner-no').click();
    await page.getByTestId('onboarding-next-btn').click();

    // Step 6: Generating step auto-advances to Step 7 (upgrade)
    // Step 7: Upgrade screen - continue-free-btn is now reachable (bug fixed)
    await expect(page.getByTestId('continue-free-btn')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('continue-free-btn').click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
  });

  test('onboarding step counter shows progress', async ({ page }) => {
    const uniqueId = Date.now();
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('register-name-input').fill(`OB_User2_${uniqueId}`);
    await page.getByTestId('register-email-input').fill(`ob2_${uniqueId}@testreg.com`);
    await page.getByTestId('register-password-input').fill('password123');
    await page.getByTestId('register-submit-btn').click();
    await expect(page).toHaveURL(/onboarding/, { timeout: 15000 });

    // Should show "1 of 8" initially
    await expect(page.getByText('1 of 8')).toBeVisible();

    // Click next, should show "2 of 8"
    await page.getByTestId('onboarding-next-btn').click();
    await expect(page.getByText('2 of 8')).toBeVisible();
  });

  test('onboarding back button works', async ({ page }) => {
    const uniqueId = Date.now();
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('register-name-input').fill(`OB_User3_${uniqueId}`);
    await page.getByTestId('register-email-input').fill(`ob3_${uniqueId}@testreg.com`);
    await page.getByTestId('register-password-input').fill('password123');
    await page.getByTestId('register-submit-btn').click();
    await expect(page).toHaveURL(/onboarding/, { timeout: 15000 });

    // Go to step 2
    await page.getByTestId('onboarding-next-btn').click();
    await expect(page.getByText('2 of 8')).toBeVisible();

    // Go back to step 1
    await page.getByTestId('onboarding-back-btn').click();
    await expect(page.getByText('1 of 8')).toBeVisible();
    await expect(page.getByTestId('goal-career')).toBeVisible();
  });

  test('onboarding requires birth date before proceeding', async ({ page }) => {
    const uniqueId = Date.now();
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('register-name-input').fill(`OB_User4_${uniqueId}`);
    await page.getByTestId('register-email-input').fill(`ob4_${uniqueId}@testreg.com`);
    await page.getByTestId('register-password-input').fill('password123');
    await page.getByTestId('register-submit-btn').click();
    await expect(page).toHaveURL(/onboarding/, { timeout: 15000 });

    // Skip to step 1 (birth info)
    await page.getByTestId('onboarding-next-btn').click();
    await expect(page.getByTestId('birth-date-input')).toBeVisible();

    // Try to proceed without filling birth date
    await page.getByTestId('onboarding-next-btn').click();
    // Should stay on step 2
    await expect(page.getByText('2 of 8')).toBeVisible();
  });
});

test.describe('Daily Luck Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await page.evaluate(() => {
      const badge = document.querySelector('[class*="emergent"], [id*="emergent-badge"]');
      if (badge) badge.remove();
    });
    await loginUser(page);
  });

  test('dashboard shows luck score card', async ({ page }) => {
    await expect(page.getByTestId('luck-score-card')).toBeVisible();
  });

  test('dashboard shows lucky info (color and number)', async ({ page }) => {
    await expect(page.getByTestId('lucky-info-card')).toBeVisible();
    // Wait for data to load
    await expect(page.locator('[data-testid="lucky-info-card"]').getByText('Color')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="lucky-info-card"]').getByText('Number')).toBeVisible();
  });

  test('dashboard shows profile card with zodiac info', async ({ page }) => {
    await expect(page.getByTestId('profile-card')).toBeVisible();
    await expect(page.locator('[data-testid="profile-card"]').getByText('Element')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="profile-card"]').getByText('Life Path')).toBeVisible();
  });

  test('dashboard shows activities guidance card', async ({ page }) => {
    await expect(page.getByTestId('activities-card')).toBeVisible();
    await expect(page.locator('[data-testid="activities-card"]').getByText('Good For')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="activities-card"]').getByText('Avoid')).toBeVisible();
  });

  test('dashboard shows 7-day forecast', async ({ page }) => {
    await expect(page.getByTestId('week-forecast-card')).toBeVisible();
    await expect(page.locator('[data-testid="week-forecast-card"]').getByText('Today')).toBeVisible({ timeout: 15000 });
  });

  test('dashboard shows score breakdown with 4 systems', async ({ page }) => {
    await expect(page.getByTestId('breakdown-card')).toBeVisible();
    await expect(page.locator('[data-testid="breakdown-card"]').getByText('Western Astrology')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="breakdown-card"]').getByText('Chinese Zodiac')).toBeVisible();
    await expect(page.locator('[data-testid="breakdown-card"]').getByText('Numerology')).toBeVisible();
    await expect(page.locator('[data-testid="breakdown-card"]').getByText('Element Balance')).toBeVisible();
  });

  test('dashboard shows Chinese Calendar card with Day Officer', async ({ page }) => {
    await expect(page.getByTestId('day-officer-card')).toBeVisible();
    const card = page.getByTestId('day-officer-card');
    // Card heading
    await expect(card.getByText('Chinese Calendar')).toBeVisible({ timeout: 15000 });
    // Day Officer label
    await expect(card.getByText('Day Officer')).toBeVisible({ timeout: 15000 });
    // Business Day label
    await expect(card.getByText('Business Day')).toBeVisible();
    // Day Zodiac label
    await expect(card.getByText('Day Zodiac')).toBeVisible();
  });

  test('dashboard Chinese Calendar card shows non-empty business quality', async ({ page }) => {
    const card = page.getByTestId('day-officer-card');
    await expect(card).toBeVisible();
    // Wait for loading to complete (business quality text appears)
    await expect(card.getByText('Business Day')).toBeVisible({ timeout: 15000 });
    // Business quality should be one of the valid values
    const validQualities = ['Excellent', 'Good', 'Moderate', 'Caution', 'Unfavorable'];
    let qualityFound = false;
    for (const q of validQualities) {
      const el = card.getByText(q);
      const count = await el.count();
      if (count > 0) { qualityFound = true; break; }
    }
    expect(qualityFound).toBeTruthy();
  });

  test('navigation to history works from dashboard', async ({ page }) => {
    await page.getByTestId('nav-history-btn').click({ force: true });
    await expect(page).toHaveURL(/history/);
  });

  test('logout works from dashboard', async ({ page }) => {
    await page.getByTestId('nav-logout-btn').click({ force: true });
    await expect(page).toHaveURL(/\//);
  });
});
