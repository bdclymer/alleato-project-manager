#!/usr/bin/env node
/**
 * Master Pipeline Runner
 * Executes the full pipeline: DB setup → Data sync → GitHub push
 * Usage: node pipeline/run.mjs
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");

function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: "inherit", ...opts });
}

function requireEnv(name) {
  if (!process.env[name]) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║   Alleato Project Manager — Full Pipeline     ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  // Validate all required env vars
  const required = [
    "JOBPLANNER_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_KEY",
    "GITHUB_TOKEN",
    "GITHUB_USERNAME",
  ];
  for (const v of required) requireEnv(v);
  console.log("All environment variables present.\n");

  // Step 1: Install dependencies
  console.log("━━━ Step 1/5: Installing dependencies ━━━");
  run("npm install");

  // Step 2: Setup Supabase database
  console.log("\n━━━ Step 2/5: Setting up Supabase database ━━━");
  run("node pipeline/setup-db.mjs");

  // Step 3: Sync Job Planner data to Supabase
  console.log("\n━━━ Step 3/5: Syncing Job Planner → Supabase ━━━");
  run("node pipeline/sync.mjs");

  // Step 4: Build Next.js app
  console.log("\n━━━ Step 4/5: Building Next.js app ━━━");
  run("npx next build");

  // Step 5: Create GitHub repo and push
  console.log("\n━━━ Step 5/5: Pushing to GitHub ━━━");

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
  const REPO_NAME = process.env.GITHUB_REPO || "alleato-project-manager";

  // Initialize git if needed
  if (!existsSync(path.join(ROOT, ".git"))) {
    run("git init");
    run('git config user.email "pipeline@alleato.com"');
    run('git config user.name "Alleato Pipeline"');
  }

  // Create the GitHub repo
  try {
    const res = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: REPO_NAME,
        description: "Alleato Group Project Manager — synced from Job Planner",
        private: false,
      }),
    });

    if (res.status === 201) {
      console.log(`GitHub repo created: ${GITHUB_USERNAME}/${REPO_NAME}`);
    } else if (res.status === 422) {
      console.log("GitHub repo already exists, will push to existing.");
    } else {
      const body = await res.text();
      console.warn(`GitHub API response ${res.status}: ${body.substring(0, 200)}`);
    }
  } catch (err) {
    console.warn(`GitHub repo creation warning: ${err.message}`);
  }

  // Add remote and push
  const remoteUrl = `https://${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${REPO_NAME}.git`;
  try { run(`git remote remove origin`); } catch {}
  run(`git remote add origin ${remoteUrl}`);
  run("git add -A");
  run('git commit -m "Initial commit: Alleato Project Manager with Job Planner sync"');
  run("git branch -M main");
  run("git push -u origin main --force");

  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║          Pipeline Complete!                    ║");
  console.log(`║  Repo: github.com/${GITHUB_USERNAME}/${REPO_NAME}  `);
  console.log("╚════════════════════════════════════════════════╝");
}

main().catch((err) => {
  console.error("\nPipeline failed:", err);
  process.exit(1);
});
