#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="${1:-http://localhost:3001}"

echo "Testing backend: $BACKEND_URL"

curl -fsS "$BACKEND_URL/health" && echo
curl -fsS "$BACKEND_URL/api/chat/health" && echo
curl -fsS "$BACKEND_URL/api/callyzer/health" && echo
curl -fsS "$BACKEND_URL/api/system/health" && echo

echo "Backend smoke test complete."
