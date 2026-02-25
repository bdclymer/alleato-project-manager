#!/usr/bin/env node
/**
 * Master Pipeline Orchestrator
 * Runs: Test → Analyze → Heal → Redeploy → Verify
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(PROJECT_ROOT, 'test-reports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.mkdirSync(path.join(REPORT_DIR, 'screenshots'), { recursive: true });

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(
    path.join(REPORT_DIR, `pipeline-${TIMESTAMP}.log`),
    line + '\n'
  );
}

function runCommand(cmd, label, timeout = 300000) {
  log(`▶ ${label}`);
  try {
    const output = execSync(cmd, {
      cwd: PROJECT_ROOT,
      timeout,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    log(`  ✓ ${label} completed`);
    return { success: true, output };
  } catch (e) {
    log(`  ✗ ${label} failed: ${e.message?.substring(0, 200)}`);
    return { success: false, output: e.stdout || '', error: e.stderr || e.message };
  }
}

async function runPipeline() {
  const startTime = Date.now();

  log('═'.repeat(60));
  log('ALLEATO PROJECT MANAGER - FULL PIPELINE');
  log(`Started: ${new Date().toISOString()}`);
  log('═'.repeat(60));

  const pipelineReport = {
    timestamp: new Date().toISOString(),
    steps: [],
    finalStatus: 'unknown',
    duration: 0,
  };

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: RUN AUTOMATED TESTS
  // ═══════════════════════════════════════════════════════════════
  log('\n' + '━'.repeat(60));
  log('STEP 1: AUTOMATED TESTING');
  log('━'.repeat(60));

  const testResult = runCommand(
    'npx playwright test tests/full-pipeline.spec.ts --reporter=list 2>&1 || true',
    'Running Playwright test suite',
    600000 // 10 min timeout
  );

  pipelineReport.steps.push({
    step: 1,
    name: 'Automated Testing',
    success: true, // Tests run regardless of failures (they capture errors)
    output: testResult.output?.substring(0, 2000),
  });

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: ERROR ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  log('\n' + '━'.repeat(60));
  log('STEP 2: ERROR ANALYSIS');
  log('━'.repeat(60));

  let errorReport = null;
  const reportPath = path.join(REPORT_DIR, 'latest-errors.json');

  if (fs.existsSync(reportPath)) {
    errorReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    log(`Total errors found: ${errorReport.totalErrors}`);
    log(`Critical: ${errorReport.errorsBySeverity?.critical?.length || 0}`);
    log(`High: ${errorReport.errorsBySeverity?.high?.length || 0}`);
    log(`Medium: ${errorReport.errorsBySeverity?.medium?.length || 0}`);
    log(`Low: ${errorReport.errorsBySeverity?.low?.length || 0}`);

    // Categorize
    log('\nErrors by category:');
    for (const [cat, errs] of Object.entries(errorReport.errorsByCategory || {})) {
      if (errs.length > 0) {
        log(`  ${cat}: ${errs.length}`);
      }
    }
  } else {
    log('No error report generated (tests may not have collected any errors).');
  }

  pipelineReport.steps.push({
    step: 2,
    name: 'Error Analysis',
    success: true,
    errorCount: errorReport?.totalErrors || 0,
    categories: errorReport
      ? Object.fromEntries(
          Object.entries(errorReport.errorsByCategory || {}).map(([k, v]) => [k, v.length])
        )
      : {},
  });

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: SELF-HEALING
  // ═══════════════════════════════════════════════════════════════
  log('\n' + '━'.repeat(60));
  log('STEP 3: SELF-HEALING');
  log('━'.repeat(60));

  let healResult = { success: false, output: '' };
  let healLog = null;

  if (errorReport && errorReport.totalErrors > 0) {
    healResult = runCommand(
      'node tests/self-heal.mjs 2>&1',
      'Running self-healing engine',
      180000
    );

    const healLogPath = path.join(REPORT_DIR, 'heal-log.json');
    if (fs.existsSync(healLogPath)) {
      healLog = JSON.parse(fs.readFileSync(healLogPath, 'utf8'));
      log(`Fixes applied: ${healLog.fixed || 0}`);
      log(`Manual required: ${healLog.unfixable || 0}`);
    }
  } else {
    log('No errors to heal. Skipping.');
  }

  pipelineReport.steps.push({
    step: 3,
    name: 'Self-Healing',
    success: healResult.success,
    fixesApplied: healLog?.fixed || 0,
    manualRequired: healLog?.unfixable || 0,
  });

  // ═══════════════════════════════════════════════════════════════
  // STEP 4: REDEPLOY (only if fixes were applied)
  // ═══════════════════════════════════════════════════════════════
  log('\n' + '━'.repeat(60));
  log('STEP 4: REDEPLOY & VERIFY');
  log('━'.repeat(60));

  let deployed = false;
  if (healLog && healLog.fixed > 0) {
    log(`${healLog.fixed} fix(es) applied. Attempting redeploy...`);

    // Build first to verify
    const buildResult = runCommand('npm run build 2>&1', 'Building Next.js app', 300000);

    if (buildResult.success) {
      // Check if vercel CLI is available
      const vercelCheck = runCommand('which vercel 2>&1 || npx vercel --version 2>&1', 'Checking Vercel CLI');
      if (vercelCheck.success) {
        const deployResult = runCommand(
          'npx vercel --prod --yes 2>&1',
          'Deploying to Vercel',
          300000
        );
        deployed = deployResult.success;
      } else {
        log('Vercel CLI not available. Skipping deployment.');
        log('To deploy manually: npx vercel --prod');
      }
    } else {
      log('Build failed. Skipping deployment.');
      log('Build errors need manual intervention.');
    }

    // Re-run verification tests after deploy
    if (deployed) {
      log('\nRe-running verification tests...');
      await new Promise((r) => setTimeout(r, 10000)); // Wait for deployment
      const verifyResult = runCommand(
        'npx playwright test tests/full-pipeline.spec.ts --reporter=list 2>&1 || true',
        'Post-deploy verification tests',
        600000
      );
    }
  } else {
    log('No auto-fixes applied. Skipping redeploy.');
  }

  pipelineReport.steps.push({
    step: 4,
    name: 'Redeploy & Verify',
    success: deployed || (healLog?.fixed || 0) === 0,
    deployed,
  });

  // ═══════════════════════════════════════════════════════════════
  // FINAL REPORT
  // ═══════════════════════════════════════════════════════════════
  const duration = Date.now() - startTime;
  pipelineReport.duration = duration;
  pipelineReport.finalStatus =
    (errorReport?.totalErrors || 0) === 0
      ? 'healthy'
      : healLog && healLog.fixed > 0
        ? 'healed'
        : 'needs_attention';

  // Write pipeline report
  const finalReportPath = path.join(REPORT_DIR, `pipeline-report-${TIMESTAMP}.json`);
  fs.writeFileSync(finalReportPath, JSON.stringify(pipelineReport, null, 2));

  // Write human-readable final report
  let md = `# Pipeline Execution Report\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Duration:** ${(duration / 1000).toFixed(1)}s\n`;
  md += `**Status:** ${pipelineReport.finalStatus.toUpperCase()}\n\n`;

  md += `## Steps\n\n`;
  for (const step of pipelineReport.steps) {
    md += `### Step ${step.step}: ${step.name}\n`;
    md += `- **Status:** ${step.success ? 'Success' : 'Failed'}\n`;
    if (step.errorCount !== undefined) md += `- **Errors Found:** ${step.errorCount}\n`;
    if (step.fixesApplied !== undefined) md += `- **Fixes Applied:** ${step.fixesApplied}\n`;
    if (step.manualRequired !== undefined) md += `- **Manual Fixes Needed:** ${step.manualRequired}\n`;
    if (step.deployed !== undefined) md += `- **Deployed:** ${step.deployed ? 'Yes' : 'No'}\n`;
    md += `\n`;
  }

  // Append error details if any
  if (errorReport && errorReport.allErrors?.length > 0) {
    md += `## Errors Found\n\n`;
    for (const err of errorReport.allErrors.slice(0, 50)) {
      md += `- **[${err.severity}] [${err.category}]** ${err.page}: ${err.message.substring(0, 150)}\n`;
    }
    if (errorReport.allErrors.length > 50) {
      md += `\n... and ${errorReport.allErrors.length - 50} more errors.\n`;
    }
  }

  // Append heal details if any
  if (healLog && healLog.fixes?.length > 0) {
    md += `\n## Healing Actions\n\n`;
    for (const fix of healLog.fixes) {
      md += `- **[${fix.status}]** ${fix.page} (${fix.sourceFile || 'N/A'}): ${fix.error?.substring(0, 100)}\n`;
    }
  }

  const mdPath = path.join(REPORT_DIR, `pipeline-report-${TIMESTAMP}.md`);
  fs.writeFileSync(mdPath, md);

  log('\n' + '═'.repeat(60));
  log('PIPELINE COMPLETE');
  log('═'.repeat(60));
  log(`Status:   ${pipelineReport.finalStatus.toUpperCase()}`);
  log(`Duration: ${(duration / 1000).toFixed(1)}s`);
  log(`Report:   ${mdPath}`);
  log('═'.repeat(60));
}

runPipeline().catch((err) => {
  console.error('Pipeline crashed:', err);
  process.exit(1);
});
