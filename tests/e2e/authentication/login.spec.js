import { test, expect } from '@playwright/test';

test.describe('E2E: Authentication Flow', () => {
  test('renders login page with email and password inputs', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('input[placeholder*="admin"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('toggles password visibility when eye icon button is clicked', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('input[placeholder*="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button
    const toggleBtn = page.locator('button[type="button"]');
    await toggleBtn.click();

    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('enforces HTML5 required field validation on empty submit', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[placeholder*="admin"]');
    await expect(emailInput).toHaveAttribute('required', '');

    const passwordInput = page.locator('input[placeholder*="password"]');
    await expect(passwordInput).toHaveAttribute('required', '');
  });
});
