// Playwright End-to-End User Flow Tests
const { test, expect } = require('@playwright/test');

test.describe('AI Outlook System Core User Flow', () => {
  test('User Login -> Dashboard -> Inbox -> Tasks Navigation', async ({ page }) => {
    // 1. Visit Login page
    await page.goto('http://localhost:3000/login');
    await expect(page).toHaveTitle(/AI Outlook|Email Intelligence/i);

    // 2. Navigate to Dashboard
    await page.goto('http://localhost:3000/dashboard');
    await expect(page.locator('body')).toContainText(/Dashboard|Overview|Emails/i);

    // 3. Navigate to Inbox
    await page.goto('http://localhost:3000/inbox');
    await expect(page.locator('body')).toContainText(/Inbox|Search|Category/i);

    // 4. Navigate to Tasks
    await page.goto('http://localhost:3000/tasks');
    await expect(page.locator('body')).toContainText(/Tasks|Action Items/i);
  });
});
