$ErrorActionPreference = "Stop"

# Starts both the API server and the client dev server in separate terminals.
# Run from the project root: `.\dev.ps1`

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$root\server`" && npm run dev" | Out-Null
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$root\client`" && npm run dev" | Out-Null

Write-Host ""
Write-Host "Client: http://localhost:5173/"
Write-Host "API health: http://localhost:3000/health"
Write-Host ""
Write-Host "If registration/login says the API is unreachable, check the ""SecureShare API"" window."
