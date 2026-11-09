import { test, expect } from '@playwright/test';

test.describe('E2E: Protected Route Navigation', () => {
  test('redirects unauthenticated user accessing /dashboard to /login', async ({ page }) => {
    // Clear any saved tokens
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('redirects unauthenticated user accessing /students to /login', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/students');
    await expect(page).toHaveURL(/.*login/);
  });
});
