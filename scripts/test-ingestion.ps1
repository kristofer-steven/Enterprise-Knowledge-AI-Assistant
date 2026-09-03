Write-Host "=== Testing Document Ingestion ===" -ForegroundColor Cyan

Write-Host "`n1. Health check..."
Invoke-RestMethod -Uri http://localhost:3001/health | ConvertTo-Json

Write-Host "`n2. Ingesting travel-policy.pdf..."
$form = @{
    file     = Get-Item -Path "sample-docs/travel-policy.pdf"
    title    = "Travel Policy"
    category = "finance"
}
Invoke-RestMethod -Uri http://localhost:5678/webhook/ingest -Method Post -Form $form | ConvertTo-Json

Write-Host "`n3. Ingesting remote-work-policy.pdf..."
$form = @{
    file     = Get-Item -Path "sample-docs/remote-work-policy.pdf"
    title    = "Remote Work Policy"
    category = "hr"
}
Invoke-RestMethod -Uri http://localhost:5678/webhook/ingest -Method Post -Form $form | ConvertTo-Json

Write-Host "`n=== Done ===" -ForegroundColor Green
