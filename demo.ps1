# Offline Demo Script for Windows PowerShell
# This script sets up and starts the Shuttle Reservation System for offline demo

Write-Host "=== Shuttle Reservation System - Offline Demo Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is installed and running
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoService = Get-Service -Name MongoDB -ErrorAction Stop
    if ($mongoService.Status -ne 'Running') {
        Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
        Start-Service MongoDB
        Start-Sleep -Seconds 3
    }
    Write-Host "MongoDB is running ✓" -ForegroundColor Green
} catch {
    Write-Host "Warning: MongoDB service not found. Please install MongoDB first." -ForegroundColor Red
    Write-Host "Download from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit
    }
}

# Check if .env file exists
Write-Host ""
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
$envPath = "app\backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Host ".env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "app\backend\.env.example" $envPath -ErrorAction SilentlyContinue
    if (-not (Test-Path $envPath)) {
        @"
MONGO_URI=mongodb://localhost:27017/shuttle-reservation
PORT=5000
JWT_SECRET=demo-secret-key-change-in-production
"@ | Out-File -FilePath $envPath -Encoding utf8
    }
    Write-Host ".env file created ✓" -ForegroundColor Green
} else {
    Write-Host ".env file exists ✓" -ForegroundColor Green
}

# Check if node_modules exist
Write-Host ""
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "app\backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location "app\backend"
    npm install
    Set-Location ..\..
}

if (-not (Test-Path "app\frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location "app\frontend"
    npm install
    Set-Location ..\..
}

Write-Host "Dependencies installed ✓" -ForegroundColor Green

# Seed database
Write-Host ""
Write-Host "Seeding database with demo data..." -ForegroundColor Yellow
Set-Location "app\backend"
npm run seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error seeding database. Please check MongoDB connection." -ForegroundColor Red
    Set-Location ..\..
    exit
}
Set-Location ..\..
Write-Host "Database seeded ✓" -ForegroundColor Green

# Display demo credentials
Write-Host ""
Write-Host "=== Demo Login Credentials ===" -ForegroundColor Cyan
Write-Host "Passenger: ava@example.com / password123" -ForegroundColor White
Write-Host "Passenger: maya@example.com / password123" -ForegroundColor White
Write-Host "Driver: liam@example.com / password123" -ForegroundColor White
Write-Host "Driver: noah@example.com / password123" -ForegroundColor White
Write-Host ""

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Green
Write-Host "Backend will run in a new window." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\app\backend'; Write-Host 'Backend Server Running on http://localhost:5000' -ForegroundColor Green; npm run dev"

# Wait for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend
Write-Host ""
Write-Host "Starting frontend..." -ForegroundColor Green
Write-Host "Press 'w' to open in web browser, 'a' for Android, 'i' for iOS" -ForegroundColor Yellow
Write-Host ""
Set-Location "app\frontend"
npm start

