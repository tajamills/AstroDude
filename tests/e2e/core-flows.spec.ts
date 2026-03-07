import { test, expect } from '@playwright/test';
import { dismissToasts } from '../fixtures/helpers';

const PAGE_URL = 'https://destiny-calc-demo.preview.emergentagent.com';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.removeItem('astro_token');
      localStorage.removeItem('astro_user');
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('landing page loads with key elements', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('nav-login-btn')).toBeVisible();
    await expect(page.getByTestId('nav-register-btn')).toBeVisible();
  });

  test('navigate to login from landing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('nav-login-btn').click();
    await expect(page).toHaveURL(/login/);
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-password-input')).toBeVisible();
    await expect(page.getByTestId('login-submit-btn')).toBeVisible();
  });

  test('navigate to register from landing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('nav-register-btn').click();
    await expect(page).toHaveURL(/register/);
    await expect(page.getByTestId('register-name-input')).toBeVisible();
    await expect(page.getByTestId('register-email-input')).toBeVisible();
    await expect(page.getByTestId('register-password-input')).toBeVisible();
    await expect(page.getByTestId('register-submit-btn')).toBeVisible();
  });
});

test.describe('User Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.removeItem('astro_token');
      localStorage.removeItem('astro_user');
    });
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('login-email-input').fill('test@astro.com');
    await page.getByTestId('login-password-input').fill('test123');
    await page.getByTestId('login-submit-btn').click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('login-email-input').fill('wrong@test.com');
    await page.getByTestId('login-password-input').fill('wrongpass');
    await page.getByTestId('login-submit-btn').click();
    // Should stay on login page
    await expect(page).toHaveURL(/login/);
  });

  test('back button from login returns to home', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('back-to-home-btn').click();
    await expect(page).toHaveURL(/\//);
  });

  test('link to register page from login works', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('go-to-register-link').click();
    await expect(page).toHaveURL(/register/);
  });
});

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.removeItem('astro_token');
      localStorage.removeItem('astro_user');
    });
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
  });

  test('register with valid data redirects to onboarding', async ({ page }) => {
    const uniqueId = Date.now();
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('register-name-input').fill(`TestUser_${uniqueId}`);
    await page.getByTestId('register-email-input').fill(`test_${uniqueId}@testreg.com`);
    await page.getByTestId('register-password-input').fill('password123');
    await page.getByTestId('register-submit-btn').click();
    await expect(page).toHaveURL(/onboarding/, { timeout: 15000 });
  });

  test('register form shows all required fields', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('register-name-input')).toBeVisible();
    await expect(page.getByTestId('register-email-input')).toBeVisible();
    await expect(page.getByTestId('register-password-input')).toBeVisible();
    await expect(page.getByTestId('register-submit-btn')).toBeVisible();
  });

  test('link to login page from register works', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('go-to-login-link').click();
    await expect(page).toHaveURL(/login/);
  });

  test('protected routes redirect unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/login/);
  });
});
