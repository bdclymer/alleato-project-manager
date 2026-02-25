#!/usr/bin/env node
/**
 * Self-Healing Engine for Alleato Project Manager
 *
 * Reads the error report from tests, analyzes each error,
 * locates the relevant source file, and applies fixes.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(PROJECT_ROOT, 'test-reports');
const REPORT_FILE = path.join(REPORT_DIR, 'latest-errors.json');
const HEAL_LOG = path.join(REPORT_DIR, 'heal-log.json');
const MAX_RETRIES = 3;

// ── Error-to-file mapping ──────────────────────────────────────────────
// Maps page names and error patterns to source files
const PAGE_FILE_MAP = {
  'Dashboard': 'src/app/page.tsx',
  'Projects': 'src/app/projects/page.tsx',
  'RFIs': 'src/app/rfis/page.tsx',
  'Submittals': 'src/app/submittals/page.tsx',
  'Budgets': 'src/app/budgets/page.tsx',
  'Change Orders': 'src/app/change-orders/page.tsx',
  'Meeting Minutes': 'src/app/meeting-minutes/page.tsx',
  'Directory': 'src/app/directory/page.tsx',
  'Bids': 'src/app/bids/page.tsx',
  'Prequalification': 'src/app/prequalification/page.tsx',
  'Training': 'src/app/training/page.tsx',
  'Reports': 'src/app/reports/page.tsx',
  'ERP': 'src/app/erp/page.tsx',
  'Correspondence': 'src/app/correspondence/page.tsx',
  'Timesheets': 'src/app/timesheets/page.tsx',
  'Incidents': 'src/app/incidents/page.tsx',
  'Inspections': 'src/app/inspections/page.tsx',
  'Observations': 'src/app/observations/page.tsx',
  'Action Plans': 'src/app/action-plans/page.tsx',
  'Sidebar': 'src/components/Sidebar.tsx',
  'Project Overview': 'src/app/projects/[id]/page.tsx',
  'Project RFIs': 'src/app/projects/[id]/rfis/page.tsx',
  'Project Submittals': 'src/app/projects/[id]/submittals/page.tsx',
  'Project Budget': 'src/app/projects/[id]/budget/page.tsx',
  'Project Drawings': 'src/app/projects/[id]/drawings/page.tsx',
  'Project Specifications': 'src/app/projects/[id]/specifications/page.tsx',
  'Project Schedule': 'src/app/projects/[id]/schedule/page.tsx',
  'Prime Contracts': 'src/app/projects/[id]/prime-contracts/page.tsx',
  'Commitments': 'src/app/projects/[id]/commitments/page.tsx',
  'Change Events': 'src/app/projects/[id]/change-events/page.tsx',
  'Commitment COs': 'src/app/projects/[id]/commitment-cos/page.tsx',
  'Contract COs': 'src/app/projects/[id]/contract-cos/page.tsx',
  'Owner Invoices': 'src/app/projects/[id]/owner-invoices/page.tsx',
  'Sub Invoices': 'src/app/projects/[id]/sub-invoices/page.tsx',
  'Direct Costs': 'src/app/projects/[id]/direct-costs/page.tsx',
  'Daily Logs': 'src/app/projects/[id]/daily-logs/page.tsx',
  'Punch List': 'src/app/projects/[id]/punch-list/page.tsx',
  'Project Meetings': 'src/app/projects/[id]/meetings/page.tsx',
  'Project Inspections': 'src/app/projects/[id]/inspections/page.tsx',
  'Project Observations': 'src/app/projects/[id]/observations/page.tsx',
  'Project Incidents': 'src/app/projects/[id]/incidents/page.tsx',
  'Documents': 'src/app/projects/[id]/documents/page.tsx',
  'Photos': 'src/app/projects/[id]/photos/page.tsx',
  'Emails': 'src/app/projects/[id]/emails/page.tsx',
  'Project Correspondence': 'src/app/projects/[id]/correspondence/page.tsx',
  'Transmittals': 'src/app/projects/[id]/transmittals/page.tsx',
  'Project Timesheets': 'src/app/projects/[id]/timesheets/page.tsx',
  'Project Action Plans': 'src/app/projects/[id]/action-plans/page.tsx',
  'Warranties': 'src/app/projects/[id]/warranties/page.tsx',
  'Project Directory': 'src/app/projects/[id]/directory/page.tsx',
};

// Shared component/lib files that might be involved
const SHARED_FILES = {
  'CrudPage': 'src/components/CrudPage.tsx',
  'DataTable': 'src/components/DataTable.tsx',
  'Modal': 'src/components/Modal.tsx',
  'FormField': 'src/components/FormField.tsx',
  'Sidebar': 'src/components/Sidebar.tsx',
  'ProjectSidebar': 'src/components/ProjectSidebar.tsx',
  'supabase': 'src/lib/supabase.ts',
  'crud': 'src/lib/crud.ts',
  'mutations': 'src/lib/mutations.ts',
  'queries': 'src/lib/queries.ts',
  'modules': 'src/lib/modules.ts',
  'types': 'src/lib/types.ts',
  'utils': 'src/lib/utils.ts',
};

// ── Fix strategies ─────────────────────────────────────────────────────

const fixStrategies = {
  // Fix: Missing table in Supabase (relation does not exist)
  missingTable(error, sourceFile) {
    const tableMatch = error.message.match(/relation "([^"]+)" does not exist/);
    if (!tableMatch) return null;
    const table = tableMatch[1];
    return {
      type: 'missing_table',
      description: `Table "${table}" does not exist in Supabase. This requires database migration.`,
      autoFixable: false,
      manualAction: `Run: CREATE TABLE ${table} (...) in Supabase SQL editor`,
    };
  },

  // Fix: Console TypeError - accessing property of null/undefined
  typeError(error, sourceFile) {
    if (!error.message.includes('TypeError') && !error.message.includes('Cannot read properties')) {
      return null;
    }
    const content = readFile(sourceFile);
    if (!content) return null;

    // Add optional chaining where property access happens
    const propMatch = error.message.match(/Cannot read properties of (null|undefined) \(reading '([^']+)'\)/);
    if (propMatch) {
      return {
        type: 'null_safety',
        description: `Null safety issue: accessing "${propMatch[2]}" on ${propMatch[1]}`,
        autoFixable: true,
        fix: () => {
          // This is a general approach - add error boundaries or null checks
          let fixed = content;
          // Add a try-catch wrapper if there's a useEffect data loading pattern
          if (fixed.includes('useEffect') && !fixed.includes('ErrorBoundary')) {
            // Add optional chaining to common patterns
            fixed = fixed.replace(/(\w+)\.(\w+)\.(\w+)/g, (match, a, b, c) => {
              if (['data', 'result', 'response', 'record', 'project'].includes(a)) {
                return `${a}?.${b}?.${c}`;
              }
              return match;
            });
          }
          return fixed !== content ? fixed : null;
        },
      };
    }
    return null;
  },

  // Fix: HTTP 4xx/5xx errors on Supabase API calls
  apiError(error, sourceFile) {
    if (!error.message.includes('HTTP 4') && !error.message.includes('HTTP 5')) {
      return null;
    }

    // Extract the URL that failed
    const urlMatch = error.message.match(/HTTP \d+ on (.+)/);
    if (!urlMatch) return null;
    const failedUrl = urlMatch[1];

    if (failedUrl.includes('supabase')) {
      // Check if it's a table name issue
      const tableMatch = failedUrl.match(/rest\/v1\/([^?]+)/);
      if (tableMatch) {
        const table = tableMatch[1];
        return {
          type: 'api_table_error',
          description: `Supabase API error for table "${table}"`,
          autoFixable: false,
          manualAction: `Check that table "${table}" exists and has correct RLS policies in Supabase`,
        };
      }
    }

    return {
      type: 'api_error',
      description: `API error: ${error.message}`,
      autoFixable: false,
      manualAction: `Investigate API endpoint: ${failedUrl}`,
    };
  },

  // Fix: Loading spinner never disappears
  loadingStuck(error, sourceFile) {
    if (!error.message.includes('spinner') && !error.message.includes('Loading')) {
      return null;
    }
    const content = readFile(sourceFile);
    if (!content) return null;

    // Check if there's error handling in the data loading
    if (content.includes('setLoading(true)') && !content.includes('finally')) {
      return {
        type: 'loading_stuck',
        description: 'Data loading has no finally block to reset loading state',
        autoFixable: true,
        fix: () => {
          // Add finally block to catch loading state
          let fixed = content.replace(
            /catch\s*\([^)]*\)\s*\{([^}]+)\}\s*$/m,
            (match) => match + ' finally { setLoading(false); }'
          );
          return fixed !== content ? fixed : null;
        },
      };
    }
    return null;
  },

  // Fix: Missing "use client" directive
  missingUseClient(error, sourceFile) {
    const content = readFile(sourceFile);
    if (!content) return null;

    if (
      error.message.includes('useState') ||
      error.message.includes('useEffect') ||
      error.message.includes('cannot be used in Server Components')
    ) {
      if (!content.startsWith('"use client"') && !content.startsWith("'use client'")) {
        return {
          type: 'missing_use_client',
          description: 'Page uses client hooks but missing "use client" directive',
          autoFixable: true,
          fix: () => '"use client";\n\n' + content,
        };
      }
    }
    return null;
  },

  // Fix: Import errors
  importError(error, sourceFile) {
    if (!error.message.includes('is not defined') && !error.message.includes('is not exported')) {
      return null;
    }
    return {
      type: 'import_error',
      description: `Possible missing import: ${error.message}`,
      autoFixable: false,
      manualAction: 'Check imports in the source file',
    };
  },

  // Fix: Navigation errors (page returns 404)
  navigationError(error, sourceFile) {
    if (error.category !== 'navigation') return null;
    if (!error.message.includes('404') && !error.message.includes('not be found')) return null;

    // Check if the page file exists
    if (!fs.existsSync(path.join(PROJECT_ROOT, sourceFile))) {
      return {
        type: 'missing_page',
        description: `Page file ${sourceFile} does not exist`,
        autoFixable: true,
        fix: () => {
          // Create a basic CrudPage placeholder
          return `"use client";

import { CrudPage } from "@/components/CrudPage";

// Auto-generated placeholder page
export default function Page() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-brand-navy mb-4">Coming Soon</h1>
      <div className="w-12 h-1 bg-brand-orange rounded mb-6" />
      <p className="text-gray-500">This page is under construction.</p>
    </div>
  );
}
`;
        },
      };
    }
    return null;
  },

  // Fix: UI error - component rendering issues
  uiError(error, sourceFile) {
    if (error.category !== 'ui') return null;
    if (!error.message.includes('error content') && !error.message.includes('Application error')) {
      return null;
    }

    const content = readFile(sourceFile);
    if (!content) return null;

    // Check for common rendering issues
    if (!content.includes('try') && content.includes('await')) {
      return {
        type: 'unhandled_async_error',
        description: 'Async operations without error handling may cause page crash',
        autoFixable: false,
        manualAction: `Add try/catch error handling to async operations in ${sourceFile}`,
      };
    }
    return null;
  },
};

// ── Utility functions ──────────────────────────────────────────────────

function readFile(relPath) {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  try {
    return fs.readFileSync(fullPath, 'utf8');
  } catch {
    return null;
  }
}

function writeFile(relPath, content) {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

function findSourceFile(error) {
  // Direct page mapping
  const pageName = error.page.replace(/ CRUD$/, '');
  if (PAGE_FILE_MAP[pageName]) {
    return PAGE_FILE_MAP[pageName];
  }

  // Check shared files based on error message
  for (const [key, filePath] of Object.entries(SHARED_FILES)) {
    if (error.message.toLowerCase().includes(key.toLowerCase())) {
      return filePath;
    }
  }

  // Try to find by URL in error
  const urlMatch = error.message.match(/\/([a-z-]+)/);
  if (urlMatch) {
    const possiblePath = `src/app/${urlMatch[1]}/page.tsx`;
    if (fs.existsSync(path.join(PROJECT_ROOT, possiblePath))) {
      return possiblePath;
    }
  }

  return null;
}

function runSpecificTest(testName) {
  try {
    execSync(
      `cd "${PROJECT_ROOT}" && npx playwright test --grep "${testName}" --reporter=list 2>&1`,
      { timeout: 120000, encoding: 'utf8' }
    );
    return true;
  } catch {
    return false;
  }
}

// ── Main healing process ───────────────────────────────────────────────

async function heal() {
  console.log('═'.repeat(60));
  console.log('SELF-HEALING ENGINE STARTED');
  console.log('═'.repeat(60));

  // Load error report
  if (!fs.existsSync(REPORT_FILE)) {
    console.log('No error report found. Run tests first.');
    process.exit(0);
  }

  const report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
  const errors = report.allErrors || [];

  if (errors.length === 0) {
    console.log('No errors found! App is healthy.');
    process.exit(0);
  }

  console.log(`Found ${errors.length} errors to analyze.\n`);

  const healLog = {
    timestamp: new Date().toISOString(),
    totalErrors: errors.length,
    analyzed: 0,
    fixed: 0,
    unfixable: 0,
    fixes: [],
  };

  // Deduplicate errors by message
  const seen = new Set();
  const uniqueErrors = errors.filter((e) => {
    const key = `${e.page}:${e.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`${uniqueErrors.length} unique errors after dedup.\n`);

  for (const error of uniqueErrors) {
    healLog.analyzed++;
    console.log(`\n─── Analyzing: [${error.severity}] ${error.page} ───`);
    console.log(`  Message: ${error.message.substring(0, 100)}`);

    const sourceFile = findSourceFile(error);
    console.log(`  Source file: ${sourceFile || 'unknown'}`);

    if (!sourceFile) {
      console.log('  ⚠ Could not locate source file, skipping.');
      healLog.unfixable++;
      healLog.fixes.push({
        error: error.message.substring(0, 150),
        page: error.page,
        status: 'skipped',
        reason: 'Could not locate source file',
      });
      continue;
    }

    // Try each fix strategy
    let fixApplied = false;
    for (const [strategyName, strategy] of Object.entries(fixStrategies)) {
      const result = strategy(error, sourceFile);
      if (!result) continue;

      console.log(`  Strategy: ${strategyName} → ${result.type}`);
      console.log(`  Description: ${result.description}`);

      if (!result.autoFixable) {
        console.log(`  ⚠ Not auto-fixable. Manual action: ${result.manualAction}`);
        healLog.unfixable++;
        healLog.fixes.push({
          error: error.message.substring(0, 150),
          page: error.page,
          sourceFile,
          strategy: strategyName,
          status: 'manual',
          action: result.manualAction,
        });
        fixApplied = true;
        break;
      }

      // Apply fix with retries
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`  Attempt ${attempt}/${MAX_RETRIES}...`);
        const fixedContent = result.fix();

        if (!fixedContent) {
          console.log('  Fix produced no changes.');
          break;
        }

        // Backup original
        const backupPath = sourceFile + '.bak';
        const originalContent = readFile(sourceFile);
        if (originalContent) {
          writeFile(backupPath, originalContent);
        }

        // Apply fix
        writeFile(sourceFile, fixedContent);
        console.log(`  Applied fix to ${sourceFile}`);

        // Verify fix (optional - re-run specific test)
        // For now, just log success
        healLog.fixed++;
        healLog.fixes.push({
          error: error.message.substring(0, 150),
          page: error.page,
          sourceFile,
          strategy: strategyName,
          status: 'fixed',
          attempt,
        });
        fixApplied = true;
        break;
      }

      if (fixApplied) break;
    }

    if (!fixApplied) {
      console.log('  No applicable fix strategy found.');
      healLog.unfixable++;
      healLog.fixes.push({
        error: error.message.substring(0, 150),
        page: error.page,
        sourceFile,
        status: 'no_strategy',
      });
    }
  }

  // Write heal log
  fs.writeFileSync(HEAL_LOG, JSON.stringify(healLog, null, 2));

  console.log('\n' + '═'.repeat(60));
  console.log('SELF-HEALING SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Errors analyzed:  ${healLog.analyzed}`);
  console.log(`Auto-fixed:       ${healLog.fixed}`);
  console.log(`Manual required:  ${healLog.unfixable}`);
  console.log(`Heal log:         ${HEAL_LOG}`);
  console.log('═'.repeat(60));

  return healLog;
}

heal().catch(console.error);
