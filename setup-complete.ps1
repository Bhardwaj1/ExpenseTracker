Write-Host "🧹 Complete setup for Personal Finance Tracker..." -ForegroundColor Green

# Clean up any existing files
Write-Host "🗑️ Cleaning up old files..." -ForegroundColor Yellow
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
if (Test-Path "server/node_modules") { Remove-Item -Recurse -Force "server/node_modules" }
if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
if (Test-Path "server/package-lock.json") { Remove-Item -Force "server/package-lock.json" }
if (Test-Path "yarn.lock") { Remove-Item -Force "yarn.lock" }
if (Test-Path "pnpm-lock.yaml") { Remove-Item -Force "pnpm-lock.yaml" }
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }

# Create environment files
if (!(Test-Path ".env.local")) {
    Write-Host "📝 Creating .env.local file..." -ForegroundColor Yellow
    @"
NEXT_PUBLIC_API_URL=http://localhost:3001/api
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
}

if (!(Test-Path "server/.env")) {
    Write-Host "📝 Creating server/.env file..." -ForegroundColor Yellow
    @"
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_tracker
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:3000
"@ | Out-File -FilePath "server/.env" -Encoding UTF8
}

# Install dependencies with all required packages
Write-Host "📦 Installing frontend dependencies (this may take a few minutes)..." -ForegroundColor Yellow
npm install

Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location server
npm install
Set-Location ..

# Test build to make sure everything works
Write-Host "🔨 Testing build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful! Setup complete!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Ready to start!" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start database services:" -ForegroundColor White
Write-Host "   npm run docker:services" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start backend (new terminal):" -ForegroundColor White
Write-Host "   npm run dev:backend" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start frontend (new terminal):" -ForegroundColor White
Write-Host "   npm run dev:frontend" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Open http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📊 Demo accounts:" -ForegroundColor Cyan
Write-Host "   Admin: admin@demo.com / admin123" -ForegroundColor White
Write-Host "   User: user@demo.com / user123" -ForegroundColor White
Write-Host "   Read-only: readonly@demo.com / readonly123" -ForegroundColor White
