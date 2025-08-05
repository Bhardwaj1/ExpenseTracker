# Windows Setup Guide

This guide will help you set up the Personal Finance Tracker on Windows without the native compilation issues.

## Quick Solutions

### Option 1: Docker Setup (Recommended)
This is the easiest way to avoid Windows compilation issues:

1. **Install Docker Desktop for Windows**
   - Download from: https://www.docker.com/products/docker-desktop
   - Make sure to enable WSL 2 integration

2. **Clone and Setup**
   \`\`\`bash
   git clone <repository-url>
   cd personal-finance-tracker
   \`\`\`

3. **Start with Docker**
   \`\`\`bash
   # Start only database and Redis
   docker-compose -f docker-compose.dev.yml up -d
   
   # Install frontend dependencies (no native compilation needed)
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   \`\`\`

4. **Run the Application**
   \`\`\`bash
   # Terminal 1: Start backend
   cd server
   npm run dev
   
   # Terminal 2: Start frontend
   npm run dev
   \`\`\`

### Option 2: Use Alternative PostgreSQL Client
If you prefer not to use Docker:

1. **Install PostgreSQL locally**
   - Download from: https://www.postgresql.org/download/windows/
   - Install with default settings

2. **Use the modified backend**
   The updated `server/index.js` includes:
   - Automatic database initialization
   - Memory cache fallback if Redis is unavailable
   - Better error handling for Windows

3. **Setup Environment**
   \`\`\`bash
   # Copy environment files
   cp .env.local.example .env.local
   cp server/.env.example server/.env
   \`\`\`

4. **Install and Run**
   \`\`\`bash
   # Install frontend (no native deps)
   npm install
   
   # Install backend
   cd server
   npm install
   
   # Start backend
   npm run dev
   
   # In another terminal, start frontend
   cd ..
   npm run dev
   \`\`\`

### Option 3: Windows Subsystem for Linux (WSL)
For the best Linux-like experience on Windows:

1. **Install WSL 2**
   ```powershell
   wsl --install
   \`\`\`

2. **Install Node.js in WSL**
   \`\`\`bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   \`\`\`

3. **Clone and run in WSL**
   \`\`\`bash
   git clone <repository-url>
   cd personal-finance-tracker
   npm install
   cd server && npm install
   \`\`\`

## Troubleshooting

### Visual Studio Build Tools Error
If you encounter the Visual Studio error:

1. **Install Visual Studio Build Tools**
   - Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - Install "C++ build tools" workload

2. **Or use Docker** (recommended to avoid this entirely)

### Node.js Version Issues
- Use Node.js 18 or 20 (avoid 22 for better compatibility)
- Use nvm-windows to manage versions: https://github.com/coreybutler/nvm-windows

### Permission Issues
Run PowerShell or Command Prompt as Administrator if you encounter permission errors.

## Features Working Without Native Compilation

The updated backend includes:
- ✅ Automatic database table creation
- ✅ Demo user insertion
- ✅ Memory cache fallback (no Redis required)
- ✅ All authentication and RBAC features
- ✅ Transaction management
- ✅ Analytics and charts
- ✅ Rate limiting and security

## Demo Accounts

Once running, use these accounts:
- **Admin**: admin@demo.com / admin123
- **User**: user@demo.com / user123
- **Read-only**: readonly@demo.com / readonly123

## Ports

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- PostgreSQL: localhost:5432 (if using Docker)
- Redis: localhost:6379 (optional)

## Need Help?

If you're still having issues:
1. Try the Docker approach first
2. Check that PostgreSQL is running
3. Verify environment variables are set
4. Check the console for specific error messages
\`\`\`

```powershell file="setup-windows.ps1"
# PowerShell script to set up the project on Windows

Write-Host "Setting up Personal Finance Tracker on Windows..." -ForegroundColor Green

# Check if Docker is installed
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "Docker found. Using Docker setup..." -ForegroundColor Green
    
    # Copy environment files
    if (!(Test-Path ".env.local")) {
        Copy-Item ".env.local.example" ".env.local"
        Write-Host "Created .env.local file" -ForegroundColor Yellow
    }
    
    if (!(Test-Path "server/.env")) {
        Copy-Item "server/.env.example" "server/.env"
        Write-Host "Created server/.env file" -ForegroundColor Yellow
    }
    
    # Start Docker services
    Write-Host "Starting Docker services..." -ForegroundColor Green
    docker-compose -f docker-compose.dev.yml up -d
    
    # Wait for services to be ready
    Write-Host "Waiting for services to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Install dependencies
    Write-Host "Installing frontend dependencies..." -ForegroundColor Green
    npm install
    
    Write-Host "Installing backend dependencies..." -ForegroundColor Green
    Set-Location server
    npm install
    Set-Location ..
    
    Write-Host "Setup complete!" -ForegroundColor Green
    Write-Host "Run 'npm run dev:backend' in one terminal and 'npm run dev:frontend' in another" -ForegroundColor Cyan
    
} else {
    Write-Host "Docker not found. Please install Docker Desktop for Windows or follow manual setup instructions." -ForegroundColor Red
    Write-Host "See WINDOWS_SETUP.md for detailed instructions." -ForegroundColor Yellow
}
