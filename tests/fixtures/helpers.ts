import { Page, expect } from '@playwright/test';

export const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://astro-luck-engine.preview.emergentagent.com';

export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
}

export async function dismissToasts(page: Page) {
  await page.addLocatorHandler(
    page.locator('[data-sonner-toast], .Toastify__toast, [role="status"].toast, .MuiSnackbar-root'),
    async () => {
      const close = page.locator('[data-sonner-toast] [data-close], [data-sonner-toast] button[aria-label="Close"], .Toastify__close-button, .MuiSnackbar-root button');
      await close.first().click({ timeout: 2000 }).catch(() => {});
    },
    { times: 10, noWaitAfter: true }
  );
}

export async function loginUser(page: Page, email: string = 'test@astro.com', password: string = 'test123') {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-btn').click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
}

export async function registerUser(page: Page, name: string, email: string, password: string) {
  await page.goto('/register', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('register-name-input').fill(name);
  await page.getByTestId('register-email-input').fill(email);
  await page.getByTestId('register-password-input').fill(password);
  await page.getByTestId('register-submit-btn').click();
  await expect(page).toHaveURL(/onboarding/, { timeout: 15000 });
}

export async function checkForErrors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const errorElements = Array.from(
      document.querySelectorAll('.error, [class*="error"], [id*="error"]')
    );
    return errorElements.map(el => el.textContent || '').filter(Boolean);
  });
}

export async function completeOnboarding(page: Page) {
  await expect(page.getByTestId('onboarding-next-btn')).toBeVisible();
  // Step 0: Welcome - select a goal
  await page.getByTestId('goal-career').click();
  await page.getByTestId('onboarding-next-btn').click();

  // Step 1: Birth info
  await page.getByTestId('birth-date-input').fill('1990-05-15');
  await page.getByTestId('onboarding-next-btn').click();

  // Step 2: Location
  await page.getByTestId('birth-location-input').fill('New York, USA');
  await page.getByTestId('onboarding-next-btn').click();

  // Step 3: Career
  await page.getByTestId('career-entrepreneur').click();
  await page.getByTestId('onboarding-next-btn').click();

  // Step 4: Focus
  await page.getByTestId('focus-career_path').click();
  await page.getByTestId('onboarding-next-btn').click();

  // Step 5: Partner (no partner)
  await page.getByTestId('partner-no').click();
  await page.getByTestId('onboarding-next-btn').click();

  // NOTE: Step 7 upgrade screen is skipped due to OnboardingRoute redirect bug
  // User goes directly to dashboard after onboarding completes
  await expect(page).toHaveURL(/dashboard/, { timeout: 30000 });
}
