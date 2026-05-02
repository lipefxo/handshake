import { expect, test } from '@playwright/test';

const routes = [
  { path: '/', text: 'Beautiful proposals.' },
  { path: '/terms', text: 'Terms of Service' },
  { path: '/privacy', text: 'Privacy Policy' },
  { path: '/login', text: 'Sign in' },
];

for (const route of routes) {
  test(`renders ${route.path}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await page.goto(route.path);
    await expect(page.getByText(route.text).first()).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
}
