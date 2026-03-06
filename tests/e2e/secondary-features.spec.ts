import { test, expect } from '@playwright/test';
import { dismissToasts, loginUser } from '../fixtures/helpers';

test.describe('Score History Page', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginUser(page);
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
  });

  test('history page loads with stats cards', async ({ page }) => {
    await expect(page.getByTestId('stats-total-days')).toBeVisible();
    await expect(page.getByTestId('stats-average')).toBeVisible();
    await expect(page.getByTestId('stats-best-day')).toBeVisible();
  });

  test('history page shows days tracked count', async ({ page }) => {
    // Wait for loading to complete
    await expect(page.locator('[data-testid="stats-total-days"] p.text-2xl')).not.toHaveText('...');
  });

  test('back to dashboard button works', async ({ page }) => {
    await page.getByTestId('back-to-dashboard-btn').click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test('history page shows history items after visit dashboard', async ({ page }) => {
    // First visit dashboard to generate today's score
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('luck-score-card')).toBeVisible();
    // Wait for data to load
    await expect(page.locator('[data-testid="luck-score-card"]').getByText('out of 100')).toBeVisible({ timeout: 15000 });
    
    // Now go to history
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
    
    // History should have at least 1 item
    await expect(page.getByTestId('history-item-0')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Mobile Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.removeItem('astro_token');
      localStorage.removeItem('astro_user');
    });
  });

  test('landing page is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('nav-login-btn')).toBeVisible();
    await expect(page.getByTestId('nav-register-btn')).toBeVisible();
    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('login form is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-password-input')).toBeVisible();
    await expect(page.getByTestId('login-submit-btn')).toBeVisible();
  });

  test('dashboard is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginUser(page);
    await expect(page.getByTestId('luck-score-card')).toBeVisible();
    await expect(page.getByTestId('nav-logout-btn')).toBeVisible();
  });
});

test.describe('Auth State Management', () => {
  test('authenticated user redirected from login to dashboard', async ({ page }) => {
    await dismissToasts(page);
    await loginUser(page);
    // Now try to go to login page - should redirect
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('logout clears auth and redirects to home', async ({ page }) => {
    await dismissToasts(page);
    await loginUser(page);
    // Logout
    await page.getByTestId('nav-logout-btn').click({ force: true });
    await expect(page).toHaveURL(/\//);
    // Now try to access protected route
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/login/);
  });
});
