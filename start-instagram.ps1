#Requires -RunAsAdministrator

# ============================================================================
# Instagram Clone - One-Click Startup Script
# ============================================================================
# This script will:
# 1. Check prerequisites (Docker, Node.js)
# 2. Stop and clean all existing containers
# 3. Start all Docker services
# 4. Run database migrations
# 5. Start backend server
# 6. Start frontend server
# 7. Open browser automatically
# ============================================================================

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Colors
$ColorSuccess = "Green"
$ColorError = "Red"
$ColorWarning = "Yellow"
$ColorInfo = "Cyan"
$ColorHeader = "Magenta"

# Configuration
$BackendPort = 8080
$FrontendPort = 3000
$MaxRetries = 30
$RetryDelay = 2

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Header {
    param([string]$Message)
    Write-Host "`n$("=" * 80)" -ForegroundColor $ColorHeader
    Write-Host "  $Message" -ForegroundColor $ColorHeader
    Write-Host "$("=" * 80)`n" -ForegroundColor $ColorHeader
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $ColorSuccess
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $ColorError
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $ColorWarning
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $ColorInfo
}

function Write-Progress {
    param([string]$Message)
    Write-Host "⏳ $Message..." -ForegroundColor $ColorInfo -NoNewline
}

function Write-Done {
    Write-Host " Done!" -ForegroundColor $ColorSuccess
}

function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        return $connection.TcpTestSucceeded
    } catch {
        return $false
    }
}

function Wait-ForService {
    param(
        [string]$ServiceName,
        [int]$Port,
        [int]$MaxAttempts = 30
    )
    
    Write-Progress "Waiting for $ServiceName"
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        if (Test-Port -Port $Port) {
            Write-Done
            return $true
        }
        Start-Sleep -Seconds $RetryDelay
        Write-Host "." -NoNewline -ForegroundColor $ColorInfo
    }
    
    Write-Host ""
    Write-Error "$ServiceName failed to start on port $Port"
    return $false
}

function Stop-ProcessOnPort {
    param([int]$Port)
    
    try {
        $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                   Select-Object -ExpandProperty OwningProcess -Unique
        
        if ($process) {
            Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
            Write-Success "Stopped process on port $Port"
        }
    } catch {
        # Port is not in use, continue
    }
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

Clear-Host

Write-Header "🚀 INSTAGRAM CLONE - ONE-CLICK STARTUP"

# ============================================================================
# STEP 1: CHECK PREREQUISITES
# ============================================================================

Write-Header "📋 STEP 1: Checking Prerequisites"

# Check Docker
Write-Progress "Checking Docker"
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Done
        Write-Info "   $dockerVersion"
    } else {
        throw "Docker not found"
    }
} catch {
    Write-Host ""
    Write-Error "Docker is not installed or not running"
    Write-Warning "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    Write-Host "`nPress any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check Docker is running
Write-Progress "Checking Docker daemon"
try {
    docker ps 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Done
    } else {
        throw "Docker not running"
    }
} catch {
    Write-Host ""
    Write-Error "Docker Desktop is not running"
    Write-Warning "Starting Docker Desktop..."
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Info "Waiting for Docker to start (this may take 30-60 seconds)..."
    
    $dockerStarted = $false
    for ($i = 1; $i -le 60; $i++) {
        Start-Sleep -Seconds 1
        try {
            docker ps 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                $dockerStarted = $true
                break
            }
        } catch {}
        Write-Host "." -NoNewline -ForegroundColor $ColorInfo
    }
    
    Write-Host ""
    if (-not $dockerStarted) {
        Write-Error "Docker failed to start. Please start Docker Desktop manually and run this script again."
        exit 1
    }
    Write-Success "Docker started successfully"
}

# Check Node.js
Write-Progress "Checking Node.js"
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Done
        Write-Info "   Node.js $nodeVersion"
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host ""
    Write-Error "Node.js is not installed"
    Write-Warning "Please install Node.js from: https://nodejs.org"
    Write-Host "`nPress any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check npm
Write-Progress "Checking npm"
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Done
    Write-Info "   npm $npmVersion"
} else {
    Write-Host ""
    Write-Error "npm is not available"
    exit 1
}

# ============================================================================
# STEP 2: CLEAN UP EXISTING PROCESSES
# ============================================================================

Write-Header "🧹 STEP 2: Cleaning Up Existing Processes"

Write-Progress "Stopping processes on port $BackendPort"
Stop-ProcessOnPort -Port $BackendPort
Write-Done

Write-Progress "Stopping processes on port $FrontendPort"
Stop-ProcessOnPort -Port $FrontendPort
Write-Done

# ============================================================================
# STEP 3: CLEAN AND START DOCKER CONTAINERS
# ============================================================================

Write-Header "🐳 STEP 3: Managing Docker Containers"

Write-Progress "Stopping all Instagram containers"
docker-compose down --remove-orphans 2>$null | Out-Null
Write-Done

Write-Progress "Removing old volumes (if any)"
docker volume prune -f 2>$null | Out-Null
Write-Done

Write-Progress "Starting Docker services (this may take 1-2 minutes)"
docker-compose up -d 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Error "Failed to start Docker services"
    Write-Warning "Trying to pull images first..."
    docker-compose pull
    docker-compose up -d
}
Write-Done

# Wait for services to be healthy
Write-Info "`nWaiting for services to be ready..."

$services = @(
    @{Name="PostgreSQL"; Port=5432},
    @{Name="Redis"; Port=6379},
    @{Name="MinIO"; Port=9000},
    @{Name="Kafka"; Port=9092}
)

foreach ($service in $services) {
    if (-not (Wait-ForService -ServiceName $service.Name -Port $service.Port)) {
        Write-Error "Service $($service.Name) failed to start"
        Write-Warning "Check logs with: docker-compose logs $($service.Name)"
        exit 1
    }
}

Write-Success "`nAll Docker services are running!"

# ============================================================================
# STEP 4: RUN DATABASE MIGRATIONS
# ============================================================================

Write-Header "📊 STEP 4: Running Database Migrations"

# Wait a bit more for PostgreSQL to be fully ready
Write-Info "Waiting for PostgreSQL to be fully ready..."
Start-Sleep -Seconds 5

$migrationFiles = Get-ChildItem -Path "backend/migrations/*.sql" | Sort-Object Name

foreach ($migration in $migrationFiles) {
    Write-Progress "Running migration: $($migration.Name)"
    
    try {
        Get-Content $migration.FullName | docker exec -i instagram-postgres psql -U postgres -d instagram 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Done
        } else {
            Write-Host ""
            Write-Warning "Migration may have already been applied: $($migration.Name)"
        }
    } catch {
        Write-Host ""
        Write-Warning "Error running migration: $($migration.Name)"
    }
}

# Verify tables created
Write-Progress "Verifying database tables"
$tables = docker exec -i instagram-postgres psql -U postgres -d instagram -c "\dt" 2>&1
if ($tables -match "users" -and $tables -match "posts" -and $tables -match "comments") {
    Write-Done
    Write-Success "Database schema created successfully"
} else {
    Write-Host ""
    Write-Warning "Some tables may not have been created. Check manually if needed."
}

# ============================================================================
# STEP 5: INSTALL BACKEND DEPENDENCIES
# ============================================================================

Write-Header "📦 STEP 5: Installing Backend Dependencies"

Set-Location -Path "backend"

if (-not (Test-Path "node_modules")) {
    Write-Progress "Installing backend dependencies (first time - may take a few minutes)"
    npm install --silent 2>&1 | Out-Null
    Write-Done
} else {
    Write-Info "Backend dependencies already installed (skipping)"
}

# ============================================================================
# STEP 6: START BACKEND SERVER
# ============================================================================

Write-Header "🔧 STEP 6: Starting Backend Server"

Write-Info "Starting backend on port $BackendPort..."

# Start backend in new window
$backendJob = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PWD'; Write-Host '🚀 Instagram Backend Server' -ForegroundColor Cyan; Write-Host '======================================' -ForegroundColor Cyan; npm run dev"
) -PassThru -WindowStyle Normal

Start-Sleep -Seconds 3

# Wait for backend to be ready
if (Wait-ForService -ServiceName "Backend API" -Port $BackendPort -MaxAttempts 30) {
    Write-Success "Backend server is running on http://localhost:$BackendPort"
} else {
    Write-Error "Backend failed to start"
    Write-Warning "Check the backend terminal window for errors"
}

# ============================================================================
# STEP 7: INSTALL FRONTEND DEPENDENCIES
# ============================================================================

Write-Header "📦 STEP 7: Installing Frontend Dependencies"

Set-Location -Path "../frontend"

if (-not (Test-Path "node_modules")) {
    Write-Progress "Installing frontend dependencies (first time - may take a few minutes)"
    npm install --silent 2>&1 | Out-Null
    Write-Done
} else {
    Write-Info "Frontend dependencies already installed (skipping)"
}

# ============================================================================
# STEP 8: START FRONTEND SERVER
# ============================================================================

Write-Header "⚛️  STEP 8: Starting Frontend Server"

Write-Info "Starting frontend on port $FrontendPort..."

# Start frontend in new window
$frontendJob = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PWD'; Write-Host '⚛️  Instagram Frontend (Next.js)' -ForegroundColor Cyan; Write-Host '======================================' -ForegroundColor Cyan; npm run dev"
) -PassThru -WindowStyle Normal

Start-Sleep -Seconds 5

# Wait for frontend to be ready
if (Wait-ForService -ServiceName "Frontend Server" -Port $FrontendPort -MaxAttempts 60) {
    Write-Success "Frontend server is running on http://localhost:$FrontendPort"
} else {
    Write-Error "Frontend failed to start"
    Write-Warning "Check the frontend terminal window for errors"
}

# ============================================================================
# STEP 9: OPEN BROWSER
# ============================================================================

Write-Header "🌐 STEP 9: Opening Browser"

Start-Sleep -Seconds 2
Write-Info "Opening Instagram Clone in your default browser..."
Start-Process "http://localhost:$FrontendPort"

# ============================================================================
# FINAL STATUS
# ============================================================================

Set-Location -Path ".."

Write-Header "✅ STARTUP COMPLETE!"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $ColorSuccess
Write-Host "║                                                                ║" -ForegroundColor $ColorSuccess
Write-Host "║  🎉 Instagram Clone is now running!                           ║" -ForegroundColor $ColorSuccess
Write-Host "║                                                                ║" -ForegroundColor $ColorSuccess
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor $ColorSuccess
Write-Host ""

Write-Host "📱 FRONTEND:        " -NoNewline -ForegroundColor $ColorInfo
Write-Host "http://localhost:$FrontendPort" -ForegroundColor $ColorSuccess

Write-Host "🔧 BACKEND API:     " -NoNewline -ForegroundColor $ColorInfo
Write-Host "http://localhost:$BackendPort" -ForegroundColor $ColorSuccess

Write-Host "💚 HEALTH CHECK:    " -NoNewline -ForegroundColor $ColorInfo
Write-Host "http://localhost:$BackendPort/health" -ForegroundColor $ColorSuccess

Write-Host ""
Write-Host "🛠️  MANAGEMENT CONSOLES:" -ForegroundColor $ColorHeader
Write-Host "   • MinIO:          http://localhost:9001 (minioadmin/minioadmin)" -ForegroundColor $ColorInfo
Write-Host "   • Kafka UI:       http://localhost:8090" -ForegroundColor $ColorInfo
Write-Host "   • PgAdmin:        http://localhost:5050 (admin@instagram.local/admin)" -ForegroundColor $ColorInfo
Write-Host "   • Redis Commander: http://localhost:8081" -ForegroundColor $ColorInfo

Write-Host ""
Write-Host "📊 DOCKER SERVICES:" -ForegroundColor $ColorHeader
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""
Write-Host "🔧 QUICK COMMANDS:" -ForegroundColor $ColorHeader
Write-Host "   • View logs:      docker-compose logs -f" -ForegroundColor $ColorInfo
Write-Host "   • Stop all:       docker-compose down" -ForegroundColor $ColorInfo
Write-Host "   • Restart:        .\start-instagram.ps1" -ForegroundColor $ColorInfo

Write-Host ""
Write-Host "⚠️  To stop the application:" -ForegroundColor $ColorWarning
Write-Host "   1. Close the backend and frontend terminal windows" -ForegroundColor $ColorWarning
Write-Host "   2. Run: docker-compose down" -ForegroundColor $ColorWarning

Write-Host ""
Write-Success "Ready to use! The browser should open automatically."
Write-Host ""

# Keep this window open
Write-Host "Press any key to exit this window (servers will keep running)..." -ForegroundColor $ColorWarning
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")