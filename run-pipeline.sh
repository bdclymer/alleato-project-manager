#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════
#  Alleato Project Manager — Full Pipeline
#  Pulls all data from Job Planner, syncs to Supabase,
#  builds the Next.js app, and pushes to GitHub.
#
#  Required env vars (set in .env or export them):
#    JOBPLANNER_API_KEY
#    SUPABASE_URL
#    SUPABASE_KEY
#    NEXT_PUBLIC_SUPABASE_URL
#    NEXT_PUBLIC_SUPABASE_ANON_KEY
#    GITHUB_TOKEN
#    GITHUB_USERNAME
# ═══════════════════════════════════════════════════════════

cd "$(dirname "$0")"

# Load .env if present
if [ -f .env ]; then
  echo "Loading .env file..."
  set -a; source .env; set +a
fi

# Validate required vars
REQUIRED_VARS="JOBPLANNER_API_KEY SUPABASE_URL SUPABASE_KEY GITHUB_TOKEN GITHUB_USERNAME"
for var in $REQUIRED_VARS; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: Missing required env var: $var"
    echo "Set it in .env or export it before running this script."
    exit 1
  fi
done

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║   Alleato Project Manager — Full Pipeline     ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Install deps ──
echo "━━━ Step 1/5: Installing dependencies ━━━"
npm install

# ── Step 2: Database setup ──
echo ""
echo "━━━ Step 2/5: Setting up Supabase tables ━━━"
echo "NOTE: Run pipeline/migration.sql in your Supabase SQL Editor"
echo "      if the exec_sql RPC function is not available."
node pipeline/setup-db.mjs || echo "DB setup via script had issues — ensure tables exist via SQL Editor."

# ── Step 3: Sync data ──
echo ""
echo "━━━ Step 3/5: Syncing Job Planner → Supabase ━━━"
node pipeline/sync.mjs

# ── Step 4: Build app ──
echo ""
echo "━━━ Step 4/5: Building Next.js app ━━━"
npx next build

# ── Step 5: GitHub ──
echo ""
echo "━━━ Step 5/5: Pushing to GitHub ━━━"

REPO_NAME="${GITHUB_REPO:-alleato-project-manager}"

# Init git if needed
if [ ! -d .git ]; then
  git init
  git config user.email "pipeline@alleato.com"
  git config user.name "Alleato Pipeline"
fi

# Create GitHub repo
curl -s -X POST "https://api.github.com/user/repos" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"Alleato Group Project Manager\",\"private\":false}" \
  > /dev/null 2>&1 || true

# Push
git remote remove origin 2>/dev/null || true
git remote add origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
git add -A
git commit -m "Alleato Project Manager — full pipeline deploy" || true
git branch -M main
git push -u origin main --force

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║              Pipeline Complete!                ║"
echo "║  Repo: github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "╚════════════════════════════════════════════════╝"
