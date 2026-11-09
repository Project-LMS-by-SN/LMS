import { test, expect } from '@playwright/test';

test.describe('E2E: User Workflows', () => {
  test('login page contains portal brand and title', async ({ page }) => {
    await page.goto('/login');

    const heading = page.locator('h1, h2, .brand-title, .login-title');
    await expect(heading.first()).toBeVisible();

    const portalFooter = page.locator('text=Library Management System');
    await expect(portalFooter.first()).toBeVisible();
  });
});
