# scripts/start-all.ps1
# Starts all Enterprise Knowledge AI Assistant services in separate PowerShell windows

$Root = Split-Path -Parent $PSScriptRoot

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Starting Enterprise Knowledge AI Assistant Services  " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Ingestion Service (:3001)
Write-Host "`n[1/4] Starting Ingestion Service on Port 3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root/services/ingestion'; Write-Host '--- Ingestion Service (:3001) ---' -ForegroundColor Cyan; npm run dev"

# 2. Query & Multi-Agent Service (:3002)
Write-Host "[2/4] Starting Multi-Agent Query Service on Port 3002..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root/services/query'; Write-Host '--- Multi-Agent Query Service (:3002) ---' -ForegroundColor Cyan; npm run dev"

# 3. MCP Tool Server (:3003)
Write-Host "[3/4] Starting MCP Tool Server on Port 3003..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root/services/mcp'; Write-Host '--- MCP Tool Server (:3003) ---' -ForegroundColor Cyan; npm run dev:sse"

# 4. Next.js Web Frontend (:3000)
Write-Host "[4/4] Starting Next.js Web UI on Port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root/services/frontend'; Write-Host '--- Next.js Frontend (:3000) ---' -ForegroundColor Cyan; npm run dev"

Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host "  All services initiated in separate windows!         " -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host "🌐 Frontend Chat UI:     http://localhost:3000"
Write-Host "📁 Document Management:  http://localhost:3000/documents"
Write-Host "🔍 Multi-Agent Trace:    http://localhost:3000/trace"
Write-Host "🤖 Query & Router API:   http://localhost:3002/api/agents/chat"
Write-Host "📥 Ingestion API:        http://localhost:3001/health"
Write-Host "🛠️ MCP Tool Server:      http://localhost:3003"
Write-Host "=======================================================`n"
