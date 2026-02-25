#!/usr/bin/env bash
# Push GitHub Actions workflow files
# Requires a GitHub PAT with 'workflow' scope
# Usage: GITHUB_TOKEN=ghp_xxx ./scripts/push-workflows.sh

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "Error: GITHUB_TOKEN must be set with 'workflow' scope"
  echo "Create one at: https://github.com/settings/tokens/new?scopes=repo,workflow"
  exit 1
fi

REPO="bdclymer/alleato-project-manager"

echo "Pushing workflow files to ${REPO}..."

# Get latest commit
LATEST=$(curl -s -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  "https://api.github.com/repos/${REPO}/git/refs/heads/main" | python3 -c "import sys,json; print(json.load(sys.stdin)['object']['sha'])")

TREE=$(curl -s -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  "https://api.github.com/repos/${REPO}/git/commits/${LATEST}" | python3 -c "import sys,json; print(json.load(sys.stdin)['tree']['sha'])")

echo "Base commit: ${LATEST}"

# Create blobs
BLOBS="["
FIRST=true
for file in deploy sync backup test monitor; do
  FILEPATH="${PROJECT_DIR}/.github/workflows/${file}.yml"
  if [ ! -f "$FILEPATH" ]; then
    echo "  Warning: ${FILEPATH} not found, skipping"
    continue
  fi
  CONTENT=$(base64 -w 0 "$FILEPATH")
  SHA=$(curl -s -X POST -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Content-Type: application/json" \
    "https://api.github.com/repos/${REPO}/git/blobs" \
    -d "{\"content\":\"${CONTENT}\",\"encoding\":\"base64\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['sha'])")

  if [ "$FIRST" = false ]; then BLOBS+=","; fi
  BLOBS+="{\"path\":\".github/workflows/${file}.yml\",\"mode\":\"100644\",\"type\":\"blob\",\"sha\":\"${SHA}\"}"
  FIRST=false
  echo "  ${file}.yml blob: ${SHA}"
done
BLOBS+="]"

# Create tree
NEW_TREE=$(curl -s -X POST -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/${REPO}/git/trees" \
  -d "{\"base_tree\":\"${TREE}\",\"tree\":${BLOBS}}" | python3 -c "import sys,json; print(json.load(sys.stdin)['sha'])")
echo "New tree: ${NEW_TREE}"

# Create commit
NEW_COMMIT=$(curl -s -X POST -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/${REPO}/git/commits" \
  -d "{\"message\":\"Add GitHub Actions workflows for autonomous CI/CD\",\"tree\":\"${NEW_TREE}\",\"parents\":[\"${LATEST}\"]}" | python3 -c "import sys,json; print(json.load(sys.stdin)['sha'])")
echo "New commit: ${NEW_COMMIT}"

# Update ref
curl -s -X PATCH -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/${REPO}/git/refs/heads/main" \
  -d "{\"sha\":\"${NEW_COMMIT}\"}" > /dev/null

echo ""
echo "Workflow files pushed successfully!"
echo "GitHub Actions will now run:"
echo "  - deploy.yml: On push to main"
echo "  - sync.yml: Every 15 minutes"
echo "  - backup.yml: Daily at midnight"
echo "  - test.yml: Every hour"
echo "  - monitor.yml: Every 6 hours"
