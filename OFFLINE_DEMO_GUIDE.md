# Offline Demo Guide for Shuttle Reservation System

This guide will help you run the Shuttle Reservation System completely offline for demos.

## Prerequisites

### 1. Install MongoDB Locally

**Windows:**
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Install MongoDB (default installation path: `C:\Program Files\MongoDB\Server\<version>\bin`)
3. MongoDB will run as a Windows service automatically, or you can start it manually:
   ```powershell
   # Start MongoDB service
   net start MongoDB
   ```

**macOS:**
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### 2. Verify MongoDB is Running

```bash
# Check if MongoDB is running
mongosh
# or
mongo
```

If it connects, you're good! Type `exit` to leave.

## Setup Steps

### Step 1: Configure Environment Variables

Create a `.env` file in `app/backend/` directory:

```env
MONGO_URI=mongodb://localhost:27017/shuttle-reservation
PORT=5000
JWT_SECRET=your-secret-key-here-change-this-in-production
```

**Important:** Use `mongodb://localhost:27017/shuttle-reservation` for local MongoDB (no internet required).

### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd app/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 3: Seed the Database

From the `app/backend` directory:

```bash
npm run seed
```

This will create:
- 4 demo users (2 passengers, 2 drivers)
- 3 shuttles
- Multiple trips with different departure times
- Sample reservations

**Demo Login Credentials:**
- **Passenger:** `ava@example.com` / `password123`
- **Passenger:** `maya@example.com` / `password123`
- **Driver:** `liam@example.com` / `password123`
- **Driver:** `noah@example.com` / `password123`

### Step 4: Start the Backend Server

From the `app/backend` directory:

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Step 5: Start the Frontend

From the `app/frontend` directory:

```bash
npm start
```

Then:
- Press `w` to open in web browser
- Press `a` to open in Android emulator
- Press `i` to open in iOS simulator
- Scan QR code with Expo Go app on your phone

**Note:** For mobile devices, make sure your phone and computer are on the same WiFi network, and update the IP address in `app/frontend/src/config/api.ts` and service files if needed.

## Quick Demo Script

Create a `demo.ps1` (Windows PowerShell) or `demo.sh` (Mac/Linux) script to automate the setup:

**Windows (`demo.ps1`):**
```powershell
# Check if MongoDB is running
$mongoRunning = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
if (-not $mongoRunning -or $mongoRunning.Status -ne 'Running') {
    Write-Host "Starting MongoDB..." -ForegroundColor Yellow
    Start-Service MongoDB
    Start-Sleep -Seconds 3
}

# Seed database
Write-Host "Seeding database..." -ForegroundColor Yellow
cd app/backend
npm run seed

# Start backend (in new window)
Write-Host "Starting backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 5

# Start frontend
Write-Host "Starting frontend..." -ForegroundColor Green
cd ../frontend
npm start
```

**Mac/Linux (`demo.sh`):**
```bash
#!/bin/bash

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "Starting MongoDB..."
    brew services start mongodb-community 2>/dev/null || sudo systemctl start mongodb
    sleep 3
fi

# Seed database
echo "Seeding database..."
cd app/backend
npm run seed

# Start backend (in background)
echo "Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend..."
cd ../frontend
npm start

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
```

## Demo Flow

1. **Login as Passenger:**
   - Email: `ava@example.com`
   - Password: `password123`

2. **View Schedule:**
   - Browse available trips
   - See different shuttles and departure times

3. **Make a Reservation:**
   - Select a trip
   - Choose a seat
   - Select destination
   - Confirm reservation

4. **View My Bookings:**
   - See active reservations
   - Cancel reservations if needed

5. **Login as Driver:**
   - Email: `liam@example.com`
   - Password: `password123`
   - View reservations for assigned shuttles
   - See trip history

6. **Map View:**
   - View shuttle route markers
   - Note: Map tiles may not load offline, but markers will still display

## Troubleshooting

### MongoDB Connection Issues

**Error: "MongoServerError: connect ECONNREFUSED"**
- Make sure MongoDB is running: `mongosh` should connect
- Check if port 27017 is not blocked by firewall
- Verify `.env` has `MONGO_URI=mongodb://localhost:27017/shuttle-reservation`

### Backend Won't Start

- Check if port 5000 is already in use
- Verify all dependencies are installed: `cd app/backend && npm install`
- Check `.env` file exists and has correct values

### Frontend Can't Connect to Backend

- Verify backend is running on `http://localhost:5000`
- Check `app/frontend/src/config/api.ts` uses `http://localhost:5000/api` for local development
- For mobile devices, use your computer's local IP address instead of `localhost`

### Map Not Loading

- This is expected offline - Google Maps requires internet
- Markers will still display, but map tiles won't load
- The app functionality (reservations, schedules) works completely offline

## Features That Work Offline

✅ User authentication  
✅ Viewing schedules and trips  
✅ Making reservations  
✅ Viewing bookings  
✅ Driver dashboard  
✅ Seat selection  
✅ All CRUD operations  

## Features That Require Internet

❌ Map tiles (Google Maps) - but markers still work  
❌ Push notifications (if using real FCM) - currently just console logs  

## Tips for Smooth Demo

1. **Pre-seed the database** before the demo
2. **Test login** with demo accounts beforehand
3. **Have backup accounts** ready (multiple passengers/drivers)
4. **Keep MongoDB running** throughout the demo
5. **Use web version** for most reliable offline experience
6. **Prepare demo scenarios:**
   - Make a new reservation
   - Cancel a reservation
   - Switch between passenger and driver views
   - Show different trip times and routes

## Reset Database

To reset and re-seed the database:

```bash
cd app/backend
npm run seed
```

This will delete all existing data and create fresh demo data.

