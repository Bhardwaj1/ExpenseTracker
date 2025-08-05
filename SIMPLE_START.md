# Simple Start Guide

## 🚀 Get Running in 2 Minutes

### Step 1: Clean Setup
\`\`\`bash
# Windows
.\setup-clean.ps1

# Linux/Mac
chmod +x setup-clean.sh && ./setup-clean.sh
\`\`\`

### Step 2: Start Services
\`\`\`bash
# Terminal 1: Start database services
npm run docker:services

# Terminal 2: Start backend
npm run dev:backend

# Terminal 3: Start frontend  
npm run dev:frontend
\`\`\`

### Step 3: Access App
- Open: http://localhost:3000
- Login: admin@demo.com / admin123

## 🔧 Commands

\`\`\`bash
# Database services only
npm run docker:services

# Development
npm run dev:frontend    # Start Next.js frontend
npm run dev:backend     # Start Express backend

# Cleanup
npm run docker:down     # Stop database services
npm run clean          # Clean all dependencies and builds
\`\`\`

## 🐳 What's Running

- **PostgreSQL**: localhost:5432 (database)
- **Redis**: localhost:6379 (cache)
- **Backend**: localhost:3001 (API)
- **Frontend**: localhost:3000 (web app)

## 🔑 Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@demo.com | admin123 | Admin |
| user@demo.com | user123 | User |
| readonly@demo.com | readonly123 | Read-only |

## 🛠️ Troubleshooting

### Port Already in Use
\`\`\`bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
\`\`\`

### Database Connection Issues
\`\`\`bash
# Check if PostgreSQL is running
docker ps

# Restart database services
npm run docker:down
npm run docker:services
\`\`\`

### Clean Start
\`\`\`bash
# Complete cleanup and restart
npm run clean
npm run docker:clean
.\setup-clean.ps1  # or ./setup-clean.sh
\`\`\`

That's it! The app should be running smoothly now.
\`\`\`
\`\`\`

```dockerignore file=".dockerignore"
node_modules
npm-debug.log
.next
.git
.gitignore
README.md
Dockerfile
.dockerignore
.env*
coverage
.nyc_output
.vscode
.idea
*.swp
*.swo
*~
.DS_Store
Thumbs.db
