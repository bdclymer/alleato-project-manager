#!/usr/bin/env node
/**
 * Performance Monitoring via Lighthouse
 * Audits key pages and logs scores with recommendations.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const BASE_URL = process.env.LIGHTHOUSE_URL || 'https://alleato-project-manager.vercel.app';
const SCORE_THRESHOLD = 70;

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Projects', path: '/projects' },
  { name: 'RFIs', path: '/rfis' },
  { name: 'Submittals', path: '/submittals' },
  { name: 'Budgets', path: '/budgets' },
  { name: 'Change Orders', path: '/change-orders' },
  { name: 'Meeting Minutes', path: '/meeting-minutes' },
];

const LOG_DIR = path.join(
  process.env.HOME || '/home/openclaw',
  'alleato-project-manager',
  'logs'
);

const REPORT_DIR = path.join(
  process.env.HOME || '/home/openclaw',
  'alleato-project-manager',
  'test-reports',
  'lighthouse'
);

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.appendFileSync(path.join(LOG_DIR, 'performance.log'), line + '\n');
}

function runLighthouse(url, outputPath) {
  try {
    // Use lighthouse CLI with chrome flags for headless
    execSync(
      `npx lighthouse "${url}" ` +
      `--output=json --output-path="${outputPath}" ` +
      `--chrome-flags="--headless --no-sandbox --disable-gpu" ` +
      `--only-categories=performance,accessibility,best-practices,seo ` +
      `--quiet`,
      {
        cwd: PROJECT_ROOT,
        timeout: 120000,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    if (fs.existsSync(outputPath)) {
      return JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    }
    return null;
  } catch (err) {
    log(`  Lighthouse error: ${err.message.substring(0, 200)}`);
    return null;
  }
}

function getScore(report, category) {
  return Math.round((report?.categories?.[category]?.score || 0) * 100);
}

function getRecommendations(report) {
  const recs = [];
  const audits = report?.audits || {};

  for (const [key, audit] of Object.entries(audits)) {
    if (audit.score !== null && audit.score < 0.9 && audit.details?.type === 'opportunity') {
      recs.push({
        title: audit.title,
        description: audit.description?.substring(0, 200),
        savings: audit.details?.overallSavingsMs
          ? `${Math.round(audit.details.overallSavingsMs)}ms`
          : null,
      });
    }
  }

  return recs.slice(0, 5); // Top 5 recommendations
}

async function audit() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(REPORT_DIR, timestamp);
  fs.mkdirSync(reportDir, { recursive: true });

  log('═══════════════════════════════════════════');
  log('LIGHTHOUSE PERFORMANCE AUDIT');
  log(`Base URL: ${BASE_URL}`);
  log('═══════════════════════════════════════════');

  const results = [];
  let warnings = 0;

  for (const page of PAGES) {
    const url = `${BASE_URL}${page.path}`;
    const outputPath = path.join(reportDir, `${page.name.toLowerCase().replace(/\s+/g, '-')}.json`);

    log(`\nAuditing: ${page.name} (${url})...`);

    const report = runLighthouse(url, outputPath);

    if (!report) {
      log(`  SKIP: Could not audit ${page.name}`);
      results.push({ page: page.name, url, error: 'audit_failed' });
      continue;
    }

    const scores = {
      performance: getScore(report, 'performance'),
      accessibility: getScore(report, 'accessibility'),
      bestPractices: getScore(report, 'best-practices'),
      seo: getScore(report, 'seo'),
    };

    const recs = getRecommendations(report);

    log(`  Performance:    ${scores.performance}`);
    log(`  Accessibility:  ${scores.accessibility}`);
    log(`  Best Practices: ${scores.bestPractices}`);
    log(`  SEO:            ${scores.seo}`);

    // Check threshold
    const belowThreshold = Object.entries(scores).filter(([, v]) => v < SCORE_THRESHOLD);
    if (belowThreshold.length > 0) {
      warnings++;
      log(`  WARNING: Below ${SCORE_THRESHOLD} threshold:`);
      for (const [cat, score] of belowThreshold) {
        log(`    - ${cat}: ${score}`);
      }
      if (recs.length > 0) {
        log('  Recommendations:');
        for (const rec of recs) {
          log(`    - ${rec.title}${rec.savings ? ` (save ~${rec.savings})` : ''}`);
        }
      }
    }

    results.push({ page: page.name, url, scores, recommendations: recs });
  }

  // Write summary report
  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    threshold: SCORE_THRESHOLD,
    results,
    warnings,
  };

  fs.writeFileSync(
    path.join(reportDir, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );

  log('\n═══════════════════════════════════════════');
  log('LIGHTHOUSE AUDIT COMPLETE');
  log(`  Pages audited: ${results.length}`);
  log(`  Warnings: ${warnings}`);
  log(`  Reports: ${reportDir}`);
  log('═══════════════════════════════════════════');
}

audit().catch((err) => {
  log(`LIGHTHOUSE AUDIT FAILED: ${err.message}`);
  console.error(err);
  process.exit(1);
});
