#!/usr/bin/env bash
set -euo pipefail
BACKEND_URL="${VITE_BACKEND_URL:-http://localhost:3001}"

echo "=== Backend health ==="
curl -sS "$BACKEND_URL/health" | jq . || curl -sS "$BACKEND_URL/health"

echo "=== Chat health ==="
curl -sS "$BACKEND_URL/api/chat/health" | jq . || curl -sS "$BACKEND_URL/api/chat/health"

echo "=== Callyzer health ==="
curl -sS "$BACKEND_URL/api/callyzer/health" | jq . || curl -sS "$BACKEND_URL/api/callyzer/health"

echo "=== System health if available ==="
curl -sS "$BACKEND_URL/api/system/health" | jq . || true

echo "Smoke test complete. Now validate UI routes manually: /admin, /admin/calls, /admin/crm, /admin/attendance."
