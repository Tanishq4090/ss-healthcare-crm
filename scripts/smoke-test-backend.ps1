param(
  [string]$BackendUrl = "http://localhost:3001"
)

Write-Host "Testing backend: $BackendUrl"

Invoke-RestMethod "$BackendUrl/health"
Invoke-RestMethod "$BackendUrl/api/chat/health"
Invoke-RestMethod "$BackendUrl/api/callyzer/health"
Invoke-RestMethod "$BackendUrl/api/system/health"

Write-Host "Backend smoke test complete."
