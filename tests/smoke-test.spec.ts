import { test, expect } from '@playwright/test';

// Smoke test: verify key pages load without errors
const pages = [
  { path: '/', heading: 'Dashboard' },
  { path: '/projects', heading: 'Projects' },
  { path: '/rfis', heading: 'RFIs' },
  { path: '/submittals', heading: 'Submittals' },
  { path: '/budgets', heading: 'Budgets' },
  { path: '/change-orders', heading: 'Change Orders' },
  { path: '/meeting-minutes', heading: 'Meeting Minutes' },
  { path: '/portfolio', heading: 'Portfolio' },
  { path: '/analytics', heading: 'Analytics' },
  { path: '/directory', heading: 'Directory' },
  { path: '/incidents', heading: 'Incidents' },
  { path: '/inspections', heading: 'Inspections' },
  { path: '/observations', heading: 'Observations' },
  { path: '/action-plans', heading: 'Action Plans' },
  { path: '/reports', heading: 'Reports' },
  { path: '/planroom', heading: 'Planroom' },
  { path: '/conversations', heading: 'Conversations' },
  { path: '/timecards', heading: 'Timecards' },
  { path: '/resource-planning', heading: 'Resource Planning' },
  { path: '/company-schedule', heading: 'Company Schedule' },
];

for (const p of pages) {
  test(`${p.path} loads without errors`, async ({ page }) => {
    // Capture console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(p.path, { waitUntil: 'networkidle' });

    // Sidebar should render
    await expect(page.locator('text=Alleato').first()).toBeVisible({ timeout: 10000 });

    // Page heading should render
    await expect(page.locator(`h1:has-text("${p.heading}")`)).toBeVisible({ timeout: 15000 });

    // No "Something went wrong" error boundary
    const errorBoundary = page.locator('text=Something went wrong');
    await expect(errorBoundary).toBeHidden({ timeout: 2000 }).catch(() => {});
    expect(await errorBoundary.count()).toBe(0);

    // Filter out non-critical console errors (Supabase 404s for missing data are OK)
    const criticalErrors = errors.filter(
      (e) => !e.includes('Failed to load resource') && !e.includes('ERR_NAME_NOT_RESOLVED')
    );
    expect(criticalErrors).toEqual([]);
  });
}
