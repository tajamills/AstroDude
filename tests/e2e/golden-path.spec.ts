import { test, expect } from '@playwright/test';
import { dismissToasts, loginUser } from '../fixtures/helpers';

test.describe('Golden Path: Full User Journey', () => {
  test('complete user journey: register → onboard → view dashboard → view history → logout', async ({ page }) => {
    await dismissToasts(page);

    // Step 1: Register a fresh user
    const uniqueId = Date.now();
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('register-name-input').fill(`GP_User_${uniqueId}`);
    await page.getByTestId('register-email-input').fill(`gp_${uniqueId}@testreg.com`);
    await page.getByTestId('register-password-input').fill('password123');
    await page.getByTestId('register-submit-btn').click();
    await expect(page).toHaveURL(/onboarding/, { timeout: 15000 });

    // Step 2: Complete onboarding wizard
    await expect(page.getByTestId('onboarding-next-btn')).toBeVisible();
    
    // Welcome step - select goals
    await page.getByTestId('goal-career').click();
    await page.getByTestId('goal-business').click();
    await page.getByTestId('onboarding-next-btn').click();
    
    // Birth step
    await expect(page.getByTestId('birth-date-input')).toBeVisible();
    await page.getByTestId('birth-date-input').fill('1988-11-22');
    await page.getByTestId('onboarding-next-btn').click();
    
    // Location step
    await expect(page.getByTestId('birth-location-input')).toBeVisible();
    await page.getByTestId('birth-location-input').fill('London, UK');
    await page.getByTestId('onboarding-next-btn').click();
    
    // Career step
    await page.getByTestId('career-finance').click();
    await page.getByTestId('onboarding-next-btn').click();
    
    // Focus step
    await page.getByTestId('focus-wealth').click();
    await page.getByTestId('onboarding-next-btn').click();
    
    // Partner step (skip)
    await page.getByTestId('partner-no').click();
    await page.getByTestId('onboarding-next-btn').click();
    
    // Step 6 (generating) auto-advances to Step 7 (upgrade)
    // Click "Continue Free" to complete onboarding and go to dashboard
    await expect(page.getByTestId('continue-free-btn')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('continue-free-btn').click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });

    // Step 3: Verify dashboard loaded with luck data
    await expect(page.getByTestId('luck-score-card')).toBeVisible();
    await expect(page.locator('[data-testid="luck-score-card"]').getByText('out of 100')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('lucky-info-card')).toBeVisible();
    await expect(page.getByTestId('week-forecast-card')).toBeVisible();
    await expect(page.getByTestId('breakdown-card')).toBeVisible();

    // Step 4: Navigate to history
    await page.getByTestId('nav-history-btn').click({ force: true });
    await expect(page).toHaveURL(/history/);
    await expect(page.getByTestId('stats-total-days')).toBeVisible();
    await expect(page.getByTestId('stats-average')).toBeVisible();

    // Step 5: Navigate back to dashboard
    await page.getByTestId('back-to-dashboard-btn').click();
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByTestId('luck-score-card')).toBeVisible();

    // Step 6: Logout
    await page.getByTestId('nav-logout-btn').click({ force: true });
    await expect(page).toHaveURL(/\//);

    // Step 7: Verify can login again
    await loginUser(page, `gp_${uniqueId}@testreg.com`, 'password123');
    await expect(page.getByTestId('luck-score-card')).toBeVisible();
  });
});
