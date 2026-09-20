# scripts/stop-all.ps1
# Cleanly terminates processes running on ports 3000, 3001, 3002, 3003

Write-Host "Stopping Enterprise Knowledge AI Assistant services..." -ForegroundColor Cyan

$ports = @(3000, 3001, 3002, 3003)

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            if ($p -gt 0) {
                try {
                    Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                    Write-Host "✅ Terminated PID $p listening on port $port" -ForegroundColor Green
                } catch {
                    Write-Host "⚠️ Could not terminate PID $p on port $port" -ForegroundColor Yellow
                }
            }
        }
    } else {
        Write-Host "ℹ️ Port $port is already free." -ForegroundColor DarkGray
    }
}

Write-Host "All ports freed." -ForegroundColor Green
