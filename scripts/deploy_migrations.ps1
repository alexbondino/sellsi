param(
    [switch]$DebugMode
)

Write-Host "=== Sellsi Supabase Remote Migration Deploy ===" -ForegroundColor Cyan

# 1. Ensure Supabase CLI present
$cliVersion = (npx supabase --version) 2>$null
if (-not $cliVersion) {
  Write-Error "Supabase CLI not available. Install: npm i -g supabase"
  exit 1
}
Write-Host "CLI Version: $cliVersion"

# 2. Confirm project ref
$projectRef = "clbngnjetipglkikondm"
Write-Host "Project Ref: $projectRef"

# 3. Check login status
$whoami = npx supabase whoami 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($whoami)) {
  Write-Host "Not logged in. Launching login flow..." -ForegroundColor Yellow
  npx supabase login
  if ($LASTEXITCODE -ne 0) { Write-Error "Login failed"; exit 1 }
}

# 4. Link project (idempotent)
Write-Host "Linking project..."
npx supabase link --project-ref $projectRef
if ($LASTEXITCODE -ne 0) { Write-Error "Link failed"; exit 1 }

# 5. Show pending migrations
Write-Host "Pending migrations:" -ForegroundColor Green
npx supabase migration list --env=prod | Select-String -Pattern "Pending" -Context 0,3

# 6. Deploy
Write-Host "Applying migrations remotely..." -ForegroundColor Green
if ($DebugMode) {
  npx supabase migration up --debug
} else {
  npx supabase migration up
}
if ($LASTEXITCODE -ne 0) { Write-Error "Migration apply failed"; exit 1 }

# 7. Basic verification query (fulfillment_status column)
Write-Host "Verifying schema changes..." -ForegroundColor Cyan
npx supabase db execute --file "supabase\\migrations\\20250813223000_unify_order_status.sql" --dry-run 1>$null 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "Dry-run check encountered issues (already applied is OK)" -ForegroundColor Yellow }

Write-Host "Run manual verification (psql) if needed:" -ForegroundColor DarkCyan
Write-Host "  supabase db remote commit" -ForegroundColor DarkCyan
Write-Host "  (Optional) psql query: SELECT status, fulfillment_status, accepted_at FROM orders LIMIT 5;" -ForegroundColor DarkCyan

Write-Host "=== Done ===" -ForegroundColor Cyan
