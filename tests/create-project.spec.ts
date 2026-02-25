import { test, expect } from '@playwright/test';

test('Create a project with blank date fields (no empty-string error)', async ({ page }) => {
  // Navigate to the projects page
  await page.goto('/projects');

  // Wait for the project list to load (the "+ New Project" button appears after loading)
  const newBtn = page.locator('button:has-text("New Project")');
  await expect(newBtn).toBeVisible({ timeout: 15000 });

  // Click the "+ New Project" button
  await newBtn.click();

  // Wait for the modal to appear
  const modal = page.locator('[class*="fixed"]').filter({ hasText: 'Project Name' });
  await expect(modal).toBeVisible({ timeout: 5000 });

  // Fill in the project name, leave dates blank
  const timestamp = Date.now();
  const projectName = `Playwright Test ${timestamp}`;
  await modal.locator('input').first().fill(projectName);

  // Verify date fields are empty
  const dateInputs = modal.locator('input[type="date"]');
  const dateCount = await dateInputs.count();
  for (let i = 0; i < dateCount; i++) {
    await expect(dateInputs.nth(i)).toHaveValue('');
  }

  // Click "Create Project" — if the bug existed, this would trigger an error alert
  page.on('dialog', async (dialog) => {
    const msg = dialog.message();
    await dialog.accept();
    throw new Error(`Unexpected alert: ${msg}`);
  });

  await modal.locator('button:has-text("Create Project")').click();

  // Wait for modal to close (means success — no error alert)
  await expect(modal).toBeHidden({ timeout: 10000 });

  // Verify the new project appears in the page
  await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 10000 });

  // Clean up: delete the test project
  const row = page.locator('tr', { hasText: projectName }).first();
  const deleteBtn = row.locator('button:has-text("Delete")');

  // Set up dialog handler for the confirm prompt
  page.removeAllListeners('dialog');
  page.on('dialog', (dialog) => dialog.accept());

  await deleteBtn.click();
  await expect(page.locator(`text=${projectName}`)).toBeHidden({ timeout: 10000 });
});
