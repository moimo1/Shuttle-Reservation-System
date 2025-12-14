# MongoDB Startup Helper Script for Windows
# This script helps you start MongoDB for the offline demo

Write-Host "=== MongoDB Startup Helper ===" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is already running
$mongodProcess = Get-Process -Name mongod -ErrorAction SilentlyContinue
if ($mongodProcess) {
    Write-Host "MongoDB is already running (PID: $($mongodProcess.Id))" -ForegroundColor Green
    Write-Host "You can proceed with starting the backend server." -ForegroundColor Green
    exit 0
}

# Check for MongoDB service
Write-Host "Checking for MongoDB service..." -ForegroundColor Yellow
$mongoService = Get-Service -Name MongoDB -ErrorAction SilentlyContinue

if ($mongoService) {
    if ($mongoService.Status -eq 'Running') {
        Write-Host "MongoDB service is running ✓" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
        try {
            Start-Service MongoDB
            Start-Sleep -Seconds 3
            Write-Host "MongoDB service started successfully ✓" -ForegroundColor Green
            exit 0
        } catch {
            Write-Host "Failed to start MongoDB service: $_" -ForegroundColor Red
        }
    }
}

# Try to find MongoDB installation
Write-Host "MongoDB service not found. Searching for MongoDB installation..." -ForegroundColor Yellow

$possiblePaths = @(
    "C:\Program Files\MongoDB\Server\*\bin\mongod.exe",
    "C:\mongodb\bin\mongod.exe",
    "$env:LOCALAPPDATA\MongoDB\bin\mongod.exe"
)

$mongodPath = $null
foreach ($path in $possiblePaths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $mongodPath = $found.FullName
        break
    }
}

if ($mongodPath) {
    Write-Host "Found MongoDB at: $mongodPath" -ForegroundColor Green
    
    # Check for data directory
    $dataDir = "$env:USERPROFILE\data\db"
    if (-not (Test-Path $dataDir)) {
        Write-Host "Creating data directory: $dataDir" -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    }
    
    Write-Host "Starting MongoDB manually..." -ForegroundColor Yellow
    Write-Host "Note: This will start MongoDB in the foreground. Press Ctrl+C to stop." -ForegroundColor Yellow
    Write-Host ""
    
    # Start MongoDB
    & $mongodPath --dbpath $dataDir
} else {
    Write-Host ""
    Write-Host "❌ MongoDB not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install MongoDB Community Server:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.mongodb.com/try/download/community" -ForegroundColor White
    Write-Host "2. Run the installer" -ForegroundColor White
    Write-Host "3. Choose 'Complete' installation" -ForegroundColor White
    Write-Host "4. Make sure to install as a Windows Service" -ForegroundColor White
    Write-Host ""
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    Write-Host ""
    
    $openBrowser = Read-Host "Open download page in browser? (y/n)"
    if ($openBrowser -eq 'y') {
        Start-Process "https://www.mongodb.com/try/download/community"
    }
    
    exit 1
}

