#!/usr/bin/env bash
# One-Click Developer Setup Script
# Usage: bash scripts/setup.sh

set -euo pipefail

echo "╔════════════════════════════════════════════╗"
echo "║  Alleato Project Manager - Setup           ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# ── Check prerequisites ──────────────────────────────────────

check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo "ERROR: $1 is required but not installed."
    echo "  $2"
    exit 1
  fi
}

check_command "node" "Install Node.js >= 18: https://nodejs.org"
check_command "npm" "Install npm (usually comes with Node.js)"
check_command "git" "Install git: https://git-scm.com"

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "ERROR: Node.js >= 18 required. Current: $(node -v)"
  exit 1
fi

echo "Prerequisites OK:"
echo "  Node.js: $(node -v)"
echo "  npm: $(npm -v)"
echo "  git: $(git --version)"
echo ""

# ── Determine project directory ───────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Project directory: $PROJECT_DIR"
cd "$PROJECT_DIR"

# ── Install dependencies ──────────────────────────────────────

echo ""
echo "Installing dependencies..."
npm install

# ── Setup environment file ────────────────────────────────────

if [ ! -f "$PROJECT_DIR/.env" ]; then
  if [ -f "$PROJECT_DIR/.env.example" ]; then
    echo ""
    echo "Creating .env from .env.example..."
    echo "Please provide the required values:"
    echo ""

    while IFS= read -r line; do
      trimmed=$(echo "$line" | sed 's/^[[:space:]]*//')

      # Skip comments and blank lines
      if [ -z "$trimmed" ] || [[ "$trimmed" == \#* ]]; then
        echo "$line" >> "$PROJECT_DIR/.env"
        continue
      fi

      KEY=$(echo "$trimmed" | cut -d= -f1)
      DEFAULT=$(echo "$trimmed" | cut -d= -f2-)

      if [[ "$DEFAULT" == *"your_"* ]] || [[ "$DEFAULT" == *"_here"* ]]; then
        printf "  %s: " "$KEY"
        read -r VALUE
        if [ -z "$VALUE" ]; then
          echo "$trimmed" >> "$PROJECT_DIR/.env"
        else
          echo "${KEY}=${VALUE}" >> "$PROJECT_DIR/.env"
        fi
      else
        echo "${KEY}=${DEFAULT}" >> "$PROJECT_DIR/.env"
      fi
    done < "$PROJECT_DIR/.env.example"

    echo ""
    echo ".env file created."
  else
    echo ""
    echo "WARNING: No .env.example found. Create .env manually."
  fi
else
  echo ""
  echo ".env file already exists."
fi

# ── Setup database ────────────────────────────────────────────

echo ""
echo "Setting up database..."
if npm run setup-db 2>&1; then
  echo "Database setup complete."
else
  echo "WARNING: Database setup encountered issues."
  echo "  You may need to run the migration SQL manually in Supabase SQL Editor."
fi

# ── Sync initial data ─────────────────────────────────────────

echo ""
echo "Syncing data from Job Planner..."
if npm run sync 2>&1; then
  echo "Data sync complete."
else
  echo "WARNING: Data sync encountered issues."
  echo "  Check your JOBPLANNER_API_KEY and SUPABASE credentials."
fi

# ── Build verification ────────────────────────────────────────

echo ""
echo "Building application..."
if npm run build 2>&1; then
  echo "Build successful."
else
  echo "WARNING: Build failed. Check for errors above."
  echo "  You can run 'npm run dev' to start in development mode."
fi

# ── Create required directories ───────────────────────────────

mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$PROJECT_DIR/test-reports"
mkdir -p "$PROJECT_DIR/backups"
mkdir -p "$PROJECT_DIR/docs"

# ── Install Playwright browsers ───────────────────────────────

echo ""
echo "Installing Playwright browsers..."
npx playwright install chromium 2>/dev/null || echo "  Playwright browsers can be installed later with: npx playwright install"

# ── Done ──────────────────────────────────────────────────────

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  Setup Complete!                           ║"
echo "╠════════════════════════════════════════════╣"
echo "║                                            ║"
echo "║  Start dev server:                         ║"
echo "║    npm run dev                              ║"
echo "║                                            ║"
echo "║  Start automation:                         ║"
echo "║    ./scripts/orchestrate.sh start           ║"
echo "║                                            ║"
echo "║  View system dashboard:                    ║"
echo "║    http://localhost:3000/system             ║"
echo "║                                            ║"
echo "╚════════════════════════════════════════════╝"

echo ""
echo "Starting development server..."
npm run dev
