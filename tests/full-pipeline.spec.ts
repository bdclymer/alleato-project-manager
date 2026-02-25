import { test, expect, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ── Configuration ──────────────────────────────────────────────────────
const BASE = 'https://alleato-project-manager.vercel.app';
const REPORT_DIR = path.join(__dirname, '..', 'test-reports');
const SS_DIR = path.join(REPORT_DIR, 'screenshots');
const TIMEOUT_NAV = 30000;
const TIMEOUT_IDLE = 8000;

// Ensure output dirs exist
fs.mkdirSync(SS_DIR, { recursive: true });

// ── Error collection ───────────────────────────────────────────────────
interface TestError {
  page: string;
  category: 'console' | 'network' | 'ui' | 'navigation' | 'crud' | 'api';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  screenshot?: string;
  timestamp: string;
}

const collectedErrors: TestError[] = [];

function logError(err: Omit<TestError, 'timestamp'>) {
  const entry: TestError = { ...err, timestamp: new Date().toISOString() };
  collectedErrors.push(entry);
  console.log(`[ERROR] [${err.category}] [${err.severity}] ${err.page}: ${err.message}`);
}

async function screenshotPage(page: Page, name: string): Promise<string> {
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80);
  const filePath = path.join(SS_DIR, `${safeName}.png`);
  await page.screenshot({ path: filePath, fullPage: true }).catch(() => {});
  return filePath;
}

// ── Helper: attach console + network listeners ─────────────────────────
function attachErrorListeners(page: Page, pageName: string) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Skip known noise
      if (text.includes('favicon') || text.includes('Download the React DevTools')) return;
      logError({
        page: pageName,
        category: 'console',
        severity: text.includes('TypeError') || text.includes('ReferenceError') ? 'critical' : 'medium',
        message: `Console error: ${text.substring(0, 300)}`,
      });
    }
  });

  page.on('pageerror', (err) => {
    logError({
      page: pageName,
      category: 'console',
      severity: 'critical',
      message: `Uncaught exception: ${err.message.substring(0, 300)}`,
    });
  });

  page.on('response', (resp) => {
    const status = resp.status();
    const url = resp.url();
    if (status >= 400 && !url.includes('favicon') && !url.includes('_next/static')) {
      logError({
        page: pageName,
        category: 'network',
        severity: status >= 500 ? 'critical' : 'high',
        message: `HTTP ${status} on ${url.substring(0, 200)}`,
      });
    }
  });
}

// ── Helper: wait for page to finish loading ────────────────────────────
async function waitForPageReady(page: Page) {
  // Wait for network to be mostly idle
  await page.waitForLoadState('networkidle', { timeout: TIMEOUT_IDLE }).catch(() => {});
  // Wait a bit for React hydration and data loading
  await page.waitForTimeout(1500);
}

// ── Helper: safely navigate to a path ──────────────────────────────────
async function safeGoto(page: Page, urlPath: string, pageName: string): Promise<boolean> {
  try {
    const resp = await page.goto(`${BASE}${urlPath}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT_NAV,
    });
    await waitForPageReady(page);
    if (!resp || resp.status() >= 400) {
      logError({
        page: pageName,
        category: 'navigation',
        severity: 'high',
        message: `Failed to load ${urlPath}: HTTP ${resp?.status() || 'no response'}`,
      });
      return false;
    }
    return true;
  } catch (e: any) {
    logError({
      page: pageName,
      category: 'navigation',
      severity: 'critical',
      message: `Navigation error to ${urlPath}: ${e.message.substring(0, 200)}`,
    });
    return false;
  }
}

// ════════════════════════════════════════════════════════════════════════
// TEST SUITE 1: NAVIGATION & PAGE LOADING
// ════════════════════════════════════════════════════════════════════════

// All top-level (company) pages
const companyPages = [
  { path: '/', name: 'Dashboard' },
  { path: '/projects', name: 'Projects' },
  { path: '/rfis', name: 'RFIs' },
  { path: '/submittals', name: 'Submittals' },
  { path: '/budgets', name: 'Budgets' },
  { path: '/change-orders', name: 'Change Orders' },
  { path: '/meeting-minutes', name: 'Meeting Minutes' },
  { path: '/directory', name: 'Directory' },
  { path: '/bids', name: 'Bids' },
  { path: '/prequalification', name: 'Prequalification' },
  { path: '/training', name: 'Training' },
  { path: '/reports', name: 'Reports' },
  { path: '/erp', name: 'ERP' },
  { path: '/correspondence', name: 'Correspondence' },
  { path: '/timesheets', name: 'Timesheets' },
  { path: '/incidents', name: 'Incidents' },
  { path: '/inspections', name: 'Inspections' },
  { path: '/observations', name: 'Observations' },
  { path: '/action-plans', name: 'Action Plans' },
];

// Project sub-pages (will be appended to /projects/{id}/)
const projectSubPages = [
  { path: '', name: 'Project Overview' },
  { path: '/rfis', name: 'Project RFIs' },
  { path: '/submittals', name: 'Project Submittals' },
  { path: '/drawings', name: 'Project Drawings' },
  { path: '/specifications', name: 'Project Specifications' },
  { path: '/schedule', name: 'Project Schedule' },
  { path: '/budget', name: 'Project Budget' },
  { path: '/prime-contracts', name: 'Prime Contracts' },
  { path: '/commitments', name: 'Commitments' },
  { path: '/change-events', name: 'Change Events' },
  { path: '/commitment-cos', name: 'Commitment COs' },
  { path: '/contract-cos', name: 'Contract COs' },
  { path: '/owner-invoices', name: 'Owner Invoices' },
  { path: '/sub-invoices', name: 'Sub Invoices' },
  { path: '/direct-costs', name: 'Direct Costs' },
  { path: '/daily-logs', name: 'Daily Logs' },
  { path: '/punch-list', name: 'Punch List' },
  { path: '/meetings', name: 'Project Meetings' },
  { path: '/inspections', name: 'Project Inspections' },
  { path: '/observations', name: 'Project Observations' },
  { path: '/incidents', name: 'Project Incidents' },
  { path: '/documents', name: 'Documents' },
  { path: '/photos', name: 'Photos' },
  { path: '/emails', name: 'Emails' },
  { path: '/correspondence', name: 'Project Correspondence' },
  { path: '/transmittals', name: 'Transmittals' },
  { path: '/timesheets', name: 'Project Timesheets' },
  { path: '/action-plans', name: 'Project Action Plans' },
  { path: '/warranties', name: 'Warranties' },
  { path: '/directory', name: 'Project Directory' },
];

test.describe('1. Company-Level Page Navigation', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    attachErrorListeners(page, 'company-nav');
  });

  test.afterAll(async () => {
    await page.close();
  });

  for (const pg of companyPages) {
    test(`loads ${pg.name} (${pg.path})`, async () => {
      const ok = await safeGoto(page, pg.path, pg.name);
      await screenshotPage(page, `page_${pg.name}`);

      if (ok) {
        // Check that the page isn't showing an error page
        const bodyText = await page.textContent('body').catch(() => '');
        const hasErrorPage =
          bodyText?.includes('Application error') ||
          bodyText?.includes('500') ||
          bodyText?.includes('This page could not be found');

        if (hasErrorPage) {
          logError({
            page: pg.name,
            category: 'ui',
            severity: 'critical',
            message: `Page shows error content`,
            screenshot: `page_${pg.name}`,
          });
        }

        // Verify the loading spinner disappears (page fully loaded)
        const spinner = page.locator('.animate-spin');
        if (await spinner.isVisible().catch(() => false)) {
          // Wait a bit more
          await page.waitForTimeout(3000);
          if (await spinner.isVisible().catch(() => false)) {
            logError({
              page: pg.name,
              category: 'ui',
              severity: 'medium',
              message: 'Loading spinner still visible after timeout',
            });
          }
        }
      }

      expect(ok).toBeTruthy();
    });
  }
});

test.describe('2. Project-Level Page Navigation', () => {
  let page: Page;
  let projectId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    attachErrorListeners(page, 'project-nav');

    // Get first project ID
    const ok = await safeGoto(page, '/projects', 'Projects List');
    if (ok) {
      await waitForPageReady(page);
      // Find the first project link
      const firstLink = page.locator('a[href^="/projects/"]').first();
      if (await firstLink.isVisible().catch(() => false)) {
        const href = await firstLink.getAttribute('href');
        if (href) {
          projectId = href.replace('/projects/', '');
          console.log(`Found project ID: ${projectId}`);
        }
      }
    }

    if (!projectId) {
      console.log('No projects found, will test with dummy ID');
      projectId = 'test-id';
    }
  });

  test.afterAll(async () => {
    await page.close();
  });

  for (const sub of projectSubPages) {
    test(`loads ${sub.name}`, async () => {
      test.skip(!projectId, 'No project ID available');
      const fullPath = `/projects/${projectId}${sub.path}`;
      const ok = await safeGoto(page, fullPath, sub.name);
      await screenshotPage(page, `project_${sub.name}`);

      if (ok) {
        const bodyText = await page.textContent('body').catch(() => '');
        if (bodyText?.includes('Application error') || bodyText?.includes('This page could not be found')) {
          logError({
            page: sub.name,
            category: 'ui',
            severity: 'critical',
            message: `Project page shows error content at ${fullPath}`,
          });
        }
      }

      expect(ok).toBeTruthy();
    });
  }
});

// ════════════════════════════════════════════════════════════════════════
// TEST SUITE 2: SIDEBAR NAVIGATION
// ════════════════════════════════════════════════════════════════════════

test.describe('3. Sidebar Navigation Links', () => {
  test('all sidebar links are present and navigable', async ({ page }) => {
    attachErrorListeners(page, 'sidebar');
    await safeGoto(page, '/', 'Dashboard');

    // Check that the sidebar is visible
    const sidebar = page.locator('nav').first();
    expect(await sidebar.isVisible()).toBeTruthy();

    // Get all sidebar links
    const links = page.locator('nav a[href]');
    const count = await links.count();
    console.log(`Found ${count} sidebar links`);

    const visitedPaths = new Set<string>();
    const brokenLinks: string[] = [];

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      if (!href || visitedPaths.has(href) || href.startsWith('http')) continue;
      visitedPaths.add(href);

      const ok = await safeGoto(page, href, `Sidebar: ${href}`);
      if (!ok) {
        brokenLinks.push(href);
      }
    }

    if (brokenLinks.length > 0) {
      logError({
        page: 'Sidebar',
        category: 'navigation',
        severity: 'high',
        message: `Broken sidebar links: ${brokenLinks.join(', ')}`,
      });
    }

    await screenshotPage(page, 'sidebar_nav');
  });
});

// ════════════════════════════════════════════════════════════════════════
// TEST SUITE 3: DASHBOARD FUNCTIONALITY
// ════════════════════════════════════════════════════════════════════════

test.describe('4. Dashboard', () => {
  test('dashboard loads with stat cards and data', async ({ page }) => {
    attachErrorListeners(page, 'dashboard');
    await safeGoto(page, '/', 'Dashboard');

    // Wait for data to load (spinner gone or heading visible)
    await page.waitForSelector('h1:has-text("Dashboard")', { state: 'visible', timeout: 15000 }).catch(() => {
      logError({
        page: 'Dashboard',
        category: 'ui',
        severity: 'high',
        message: 'Dashboard heading never appeared',
      });
    });

    // Extra wait for data
    await page.waitForTimeout(3000);

    await screenshotPage(page, 'dashboard_loaded');

    // Check for stat cards
    const heading = page.locator('h1:has-text("Dashboard")');
    const headingVisible = await heading.isVisible().catch(() => false);
    expect(headingVisible).toBeTruthy();

    // Check stat card links
    const statLinks = page.locator('a.bg-white');
    const statCount = await statLinks.count();
    console.log(`Dashboard has ${statCount} stat cards`);

    if (statCount === 0) {
      logError({
        page: 'Dashboard',
        category: 'ui',
        severity: 'high',
        message: 'No stat cards rendered on dashboard',
      });
    }

    // Check Recent Projects section
    const recentProjects = page.locator('text=Recent Projects');
    expect(await recentProjects.isVisible()).toBeTruthy();

    // Check Open RFIs section
    const openRFIs = page.locator('text=Open RFIs');
    expect(await openRFIs.isVisible()).toBeTruthy();
  });

  test('dashboard stat cards link to correct pages', async ({ page }) => {
    attachErrorListeners(page, 'dashboard-links');
    await safeGoto(page, '/', 'Dashboard');
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 }).catch(() => {});

    const linkTests = [
      { text: 'Projects', expectedPath: '/projects' },
      { text: 'RFIs', expectedPath: '/rfis' },
      { text: 'Submittals', expectedPath: '/submittals' },
      { text: 'Budgets', expectedPath: '/budgets' },
    ];

    for (const lt of linkTests) {
      const link = page.locator(`a:has-text("${lt.text}")`).first();
      if (await link.isVisible().catch(() => false)) {
        const href = await link.getAttribute('href');
        if (href && !href.includes(lt.expectedPath)) {
          logError({
            page: 'Dashboard',
            category: 'navigation',
            severity: 'medium',
            message: `Stat card "${lt.text}" links to ${href} instead of ${lt.expectedPath}`,
          });
        }
      }
    }
  });
});

// ════════════════════════════════════════════════════════════════════════
// TEST SUITE 4: CRUD OPERATIONS
// ════════════════════════════════════════════════════════════════════════

test.describe('5. Projects CRUD', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    attachErrorListeners(page, 'projects-crud');
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('create a new project', async () => {
    await safeGoto(page, '/projects', 'Projects');
    await waitForPageReady(page);
    await screenshotPage(page, 'crud_projects_before_create');

    // Click "New Project" button
    const newBtn = page.locator('button:has-text("New Project")');
    if (await newBtn.isVisible().catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      // Fill in the form
      const nameInput = page.locator('input').first();
      await nameInput.fill('Test Project Pipeline ' + Date.now());

      await screenshotPage(page, 'crud_projects_create_form');

      // Submit
      const saveBtn = page.locator('button:has-text("Create Project")');
      if (await saveBtn.isVisible().catch(() => false)) {
        // Listen for dialog (alert on error)
        page.on('dialog', async (dialog) => {
          logError({
            page: 'Projects CRUD',
            category: 'crud',
            severity: 'high',
            message: `Dialog appeared during create: ${dialog.message()}`,
          });
          await dialog.accept();
        });

        await saveBtn.click();
        await page.waitForTimeout(3000);
        await waitForPageReady(page);
        await screenshotPage(page, 'crud_projects_after_create');
      } else {
        logError({
          page: 'Projects CRUD',
          category: 'ui',
          severity: 'high',
          message: 'Create Project submit button not found',
        });
      }
    } else {
      logError({
        page: 'Projects CRUD',
        category: 'ui',
        severity: 'critical',
        message: 'New Project button not found',
      });
    }
  });

  test('edit an existing project', async () => {
    await safeGoto(page, '/projects', 'Projects');
    await waitForPageReady(page);

    // Find and click an Edit button
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);

      await screenshotPage(page, 'crud_projects_edit_form');

      // Modify the description
      const textarea = page.locator('textarea').first();
      if (await textarea.isVisible().catch(() => false)) {
        await textarea.fill('Updated by pipeline test at ' + new Date().toISOString());
      }

      const saveBtn = page.locator('button:has-text("Save Changes")');
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        await waitForPageReady(page);
        await screenshotPage(page, 'crud_projects_after_edit');
      }
    } else {
      logError({
        page: 'Projects CRUD',
        category: 'ui',
        severity: 'medium',
        message: 'No Edit button found (may have no projects)',
      });
    }
  });

  test('delete a project', async () => {
    await safeGoto(page, '/projects', 'Projects');
    await waitForPageReady(page);

    // Handle the confirm dialog BEFORE clicking
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Find the test project we created and delete it
    const deleteBtn = page.locator('button:has-text("Delete")').first();
    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(3000);
      await waitForPageReady(page);
      await screenshotPage(page, 'crud_projects_after_delete');
    } else {
      logError({
        page: 'Projects CRUD',
        category: 'ui',
        severity: 'low',
        message: 'No Delete button found',
      });
    }
  });
});

// ── CRUD tests for CrudPage-based modules ──────────────────────────────
const crudModules = [
  { path: '/rfis', name: 'RFIs', singular: 'RFI' },
  { path: '/submittals', name: 'Submittals', singular: 'Submittal' },
  { path: '/budgets', name: 'Budgets', singular: 'Budget' },
  { path: '/change-orders', name: 'Change Orders', singular: 'Change Order' },
  { path: '/meeting-minutes', name: 'Meeting Minutes', singular: 'Meeting' },
  { path: '/directory', name: 'Directory', singular: 'Contact' },
  { path: '/bids', name: 'Bids', singular: 'Bid' },
  { path: '/correspondence', name: 'Correspondence', singular: 'Correspondence' },
  { path: '/timesheets', name: 'Timesheets', singular: 'Timesheet' },
  { path: '/incidents', name: 'Incidents', singular: 'Incident' },
  { path: '/inspections', name: 'Inspections', singular: 'Inspection' },
  { path: '/observations', name: 'Observations', singular: 'Observation' },
  { path: '/action-plans', name: 'Action Plans', singular: 'Action Plan' },
  { path: '/training', name: 'Training', singular: 'Training' },
  { path: '/prequalification', name: 'Prequalification', singular: 'Prequalification' },
];

test.describe('6. CrudPage Module CRUD Operations', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    attachErrorListeners(page, 'crud-modules');
  });

  test.afterAll(async () => {
    await page.close();
  });

  for (const mod of crudModules) {
    test(`${mod.name}: create, edit, delete cycle`, async () => {
      await safeGoto(page, mod.path, mod.name);
      await waitForPageReady(page);
      await screenshotPage(page, `crud_${mod.name}_list`);

      // ── CREATE ──
      const newBtn = page.locator(`button:has-text("New ${mod.singular}")`).first();
      if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        // Fill in the first text input in the modal
        const modal = page.locator('[class*="fixed"]').last();
        const firstInput = modal.locator('input[type="text"], input:not([type])').first();
        if (await firstInput.isVisible().catch(() => false)) {
          await firstInput.fill(`Pipeline Test ${mod.singular} ${Date.now()}`);
        }

        await screenshotPage(page, `crud_${mod.name}_create_form`);

        // Click Create/Save button
        const createBtn = modal.locator('button:has-text("Create"), button:has-text("Save")').first();
        if (await createBtn.isVisible().catch(() => false)) {
          // Handle potential alert dialogs
          page.once('dialog', async (d) => {
            logError({
              page: `${mod.name} CRUD`,
              category: 'crud',
              severity: 'high',
              message: `Dialog on create: ${d.message()}`,
            });
            await d.accept();
          });
          await createBtn.click();
          await page.waitForTimeout(2000);
          await waitForPageReady(page);
        }

        await screenshotPage(page, `crud_${mod.name}_after_create`);
      } else {
        logError({
          page: mod.name,
          category: 'ui',
          severity: 'medium',
          message: `New ${mod.singular} button not found`,
        });
      }

      // Ensure any open modal is closed before proceeding
      const openModal = page.locator('div.fixed.inset-0');
      if (await openModal.isVisible({ timeout: 1000 }).catch(() => false)) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        // If still open, click the Cancel button
        if (await openModal.isVisible({ timeout: 500 }).catch(() => false)) {
          const cancelBtn = page.locator('button:has-text("Cancel")').first();
          if (await cancelBtn.isVisible().catch(() => false)) {
            await cancelBtn.click();
            await page.waitForTimeout(500);
          }
        }
      }

      // ── EDIT (click first row to open edit modal) ──
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible().catch(() => false)) {
        await firstRow.click({ force: true });
        await page.waitForTimeout(500);

        const editModal = page.locator('[class*="fixed"]').last();
        const updateBtn = editModal.locator('button:has-text("Update")').first();
        if (await updateBtn.isVisible().catch(() => false)) {
          await screenshotPage(page, `crud_${mod.name}_edit_form`);
          page.once('dialog', async (d) => {
            logError({
              page: `${mod.name} CRUD`,
              category: 'crud',
              severity: 'high',
              message: `Dialog on update: ${d.message()}`,
            });
            await d.accept();
          });
          await updateBtn.click();
          await page.waitForTimeout(2000);
          await waitForPageReady(page);
        }
      }

      // ── DELETE (click the trash icon on first row) ──
      const deleteIcon = page.locator('table tbody tr button[title="Delete"]').first();
      if (await deleteIcon.isVisible().catch(() => false)) {
        await deleteIcon.click();
        await page.waitForTimeout(500);

        // Confirm deletion in the modal
        const deleteConfirmBtn = page.locator('button:has-text("Delete")').last();
        if (await deleteConfirmBtn.isVisible().catch(() => false)) {
          await screenshotPage(page, `crud_${mod.name}_delete_confirm`);
          await deleteConfirmBtn.click();
          await page.waitForTimeout(2000);
          await waitForPageReady(page);
          await screenshotPage(page, `crud_${mod.name}_after_delete`);
        }
      }
    });
  }
});

// ════════════════════════════════════════════════════════════════════════
// TEST SUITE 5: VISUAL / UI CHECKS
// ════════════════════════════════════════════════════════════════════════

test.describe('7. Visual and UI Checks', () => {
  test('check for broken images and missing assets', async ({ page }) => {
    attachErrorListeners(page, 'visual-check');
    await safeGoto(page, '/', 'Dashboard');

    const images = page.locator('img');
    const imgCount = await images.count();
    for (let i = 0; i < imgCount; i++) {
      const src = await images.nth(i).getAttribute('src');
      const isVisible = await images.nth(i).isVisible().catch(() => false);
      const naturalWidth = await images.nth(i).evaluate((el: HTMLImageElement) => el.naturalWidth).catch(() => 0);

      if (isVisible && naturalWidth === 0) {
        logError({
          page: 'Dashboard',
          category: 'ui',
          severity: 'medium',
          message: `Broken image: ${src}`,
        });
      }
    }
  });

  test('check page layout and responsiveness', async ({ page }) => {
    attachErrorListeners(page, 'layout');
    await safeGoto(page, '/', 'Dashboard');

    // Check desktop layout
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    await screenshotPage(page, 'layout_desktop');

    // Check sidebar is visible on desktop
    const sidebar = page.locator('nav').first();
    expect(await sidebar.isVisible()).toBeTruthy();

    // Check tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await screenshotPage(page, 'layout_tablet');

    // Check mobile layout
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await screenshotPage(page, 'layout_mobile');

    // Check for horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    if (bodyWidth > viewportWidth + 5) {
      logError({
        page: 'Dashboard (mobile)',
        category: 'ui',
        severity: 'medium',
        message: `Horizontal overflow detected: body=${bodyWidth}px, viewport=${viewportWidth}px`,
      });
    }
  });

  test('check search functionality on CRUD pages', async ({ page }) => {
    attachErrorListeners(page, 'search');
    await safeGoto(page, '/directory', 'Directory');
    await waitForPageReady(page);

    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      await screenshotPage(page, 'search_filter_active');

      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(500);
    } else {
      logError({
        page: 'Directory',
        category: 'ui',
        severity: 'low',
        message: 'Search input not found on CRUD page',
      });
    }
  });
});

// ════════════════════════════════════════════════════════════════════════
// TEST SUITE 6: ERROR REPORT GENERATION
// ════════════════════════════════════════════════════════════════════════

test.describe('8. Report Generation', () => {
  test('generate error report', async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Build structured report
    const report = {
      timestamp: new Date().toISOString(),
      totalErrors: collectedErrors.length,
      errorsByCategory: {
        console: collectedErrors.filter((e) => e.category === 'console'),
        network: collectedErrors.filter((e) => e.category === 'network'),
        ui: collectedErrors.filter((e) => e.category === 'ui'),
        navigation: collectedErrors.filter((e) => e.category === 'navigation'),
        crud: collectedErrors.filter((e) => e.category === 'crud'),
        api: collectedErrors.filter((e) => e.category === 'api'),
      },
      errorsBySeverity: {
        critical: collectedErrors.filter((e) => e.severity === 'critical'),
        high: collectedErrors.filter((e) => e.severity === 'high'),
        medium: collectedErrors.filter((e) => e.severity === 'medium'),
        low: collectedErrors.filter((e) => e.severity === 'low'),
      },
      allErrors: collectedErrors,
    };

    // Write JSON report
    const jsonPath = path.join(REPORT_DIR, `error-report-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Write human-readable report
    let md = `# Alleato Project Manager - Test Report\n`;
    md += `**Date:** ${new Date().toISOString()}\n`;
    md += `**Total Errors Found:** ${report.totalErrors}\n\n`;

    md += `## Summary by Severity\n`;
    md += `| Severity | Count |\n|----------|-------|\n`;
    md += `| Critical | ${report.errorsBySeverity.critical.length} |\n`;
    md += `| High | ${report.errorsBySeverity.high.length} |\n`;
    md += `| Medium | ${report.errorsBySeverity.medium.length} |\n`;
    md += `| Low | ${report.errorsBySeverity.low.length} |\n\n`;

    md += `## Summary by Category\n`;
    md += `| Category | Count |\n|----------|-------|\n`;
    for (const [cat, errs] of Object.entries(report.errorsByCategory)) {
      md += `| ${cat} | ${errs.length} |\n`;
    }
    md += `\n`;

    md += `## Detailed Errors\n\n`;
    for (const err of collectedErrors) {
      md += `### [${err.severity.toUpperCase()}] [${err.category}] ${err.page}\n`;
      md += `- **Message:** ${err.message}\n`;
      md += `- **Time:** ${err.timestamp}\n`;
      if (err.screenshot) md += `- **Screenshot:** ${err.screenshot}\n`;
      md += `\n`;
    }

    const mdPath = path.join(REPORT_DIR, `test-report-${timestamp}.md`);
    fs.writeFileSync(mdPath, md);

    // Also write latest report for pipeline to pick up
    fs.writeFileSync(path.join(REPORT_DIR, 'latest-errors.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(REPORT_DIR, 'latest-report.md'), md);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST REPORT GENERATED`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total errors: ${report.totalErrors}`);
    console.log(`Critical: ${report.errorsBySeverity.critical.length}`);
    console.log(`High: ${report.errorsBySeverity.high.length}`);
    console.log(`Medium: ${report.errorsBySeverity.medium.length}`);
    console.log(`Low: ${report.errorsBySeverity.low.length}`);
    console.log(`JSON report: ${jsonPath}`);
    console.log(`MD report: ${mdPath}`);
    console.log(`${'='.repeat(60)}\n`);
  });
});
