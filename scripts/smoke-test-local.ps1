# SS Healthcare Admin OS — Local Smoke Test
# Run from repository root after backend/frontend are running.

$ErrorActionPreference = "Stop"

$backend = $env:VITE_BACKEND_URL
if (-not $backend) { $backend = "http://localhost:3001" }

Write-Host "=== Backend health ==="
Invoke-RestMethod -Uri "$backend/health" -Method GET | ConvertTo-Json -Depth 5

Write-Host "=== Chat health ==="
Invoke-RestMethod -Uri "$backend/api/chat/health" -Method GET | ConvertTo-Json -Depth 5

Write-Host "=== Callyzer health ==="
Invoke-RestMethod -Uri "$backend/api/callyzer/health" -Method GET | ConvertTo-Json -Depth 5

Write-Host "=== System health if available ==="
try {
  Invoke-RestMethod -Uri "$backend/api/system/health" -Method GET | ConvertTo-Json -Depth 5
} catch {
  Write-Host "System health route not available. Continue if other health checks passed." -ForegroundColor Yellow
}

Write-Host "Smoke test complete. Now validate UI routes manually: /admin, /admin/calls, /admin/crm, /admin/attendance." -ForegroundColor Green
