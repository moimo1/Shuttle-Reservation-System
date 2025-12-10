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

### Step 5: Configure for Multi-User Network Access

**For single-user (same machine only):**
- Skip this step - the default `localhost` configuration will work.

**For multi-user (multiple devices on same network):**

1. **Find your computer's local IP address:**
   ```bash
   # From project root
   npm run get-ip
   ```
   
   Or manually:
   - **Windows:** Open PowerShell and run `ipconfig`, look for "IPv4 Address" under your active network adapter
   - **Mac/Linux:** Run `ifconfig` or `ip addr`, look for your WiFi/Ethernet adapter's inet address

2. **Update frontend configuration:**
   - Open `app/frontend/src/config/api.ts`
   - Find the line: `const LOCAL_IP = "192.168.1.2";`
   - Replace `"192.168.1.2"` with your actual local IP address (e.g., `"192.168.1.100"`)
   - Save the file

3. **Verify backend is accessible:**
   - When you start the backend, it will display your local IP address
   - Make sure it matches what you set in the frontend config

### Step 6: Start the Frontend

From the `app/frontend` directory:

```bash
npm start
```

Then:
- Press `w` to open in web browser
- Press `a` to open in Android emulator
- Press `i` to open in iOS simulator
- Scan QR code with Expo Go app on your phone

**For multi-user setup:**
- All devices must be on the **same WiFi network**
- Each device will connect to your computer's IP address
- The backend server must be running on your computer

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
- Check `app/frontend/src/config/api.ts` uses the correct IP address
- For single-user: Use `localhost` in the config
- For multi-user: Use your computer's local IP address (run `npm run get-ip` to find it)
- Make sure all devices are on the same WiFi network
- Check Windows Firewall isn't blocking port 5000

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

## Multi-User Setup (Same Network)

The system supports multiple users connecting simultaneously as long as they're on the same local network (no internet required).

### Setup for Multiple Users:

1. **On the host computer (running the server):**
   - Start MongoDB
   - Start the backend server (it will display your local IP)
   - Note your local IP address (shown when backend starts, or run `npm run get-ip`)

2. **Configure frontend for network access:**
   - Open `app/frontend/src/config/api.ts`
   - Update `LOCAL_IP` constant with your computer's IP address
   - Example: `const LOCAL_IP = "192.168.1.100";`

3. **On each client device:**
   - Connect to the same WiFi network as the host computer
   - Open the app (web browser, Expo Go, or emulator)
   - The app will automatically connect to the backend using the configured IP

### Network Requirements:

- ✅ All devices must be on the **same WiFi network**
- ✅ Backend server must be running on the host computer
- ✅ MongoDB must be running on the host computer
- ✅ Windows Firewall may need to allow port 5000 (backend will prompt you)
- ✅ No internet connection required - works completely offline

### Testing Multi-User:

1. Start backend on host computer
2. Note the IP address shown (e.g., `192.168.1.100`)
3. Update frontend config with that IP
4. Open app on multiple devices:
   - Host computer: `npm start` then press `w` for web
   - Other devices: Scan QR code with Expo Go, or access via web browser at `http://YOUR_IP:19006`
5. Each user can log in with different accounts and make reservations simultaneously

### Windows Firewall Configuration:

If devices can't connect, Windows Firewall may be blocking the connection:

1. When backend starts, Windows may show a firewall prompt - click "Allow access"
2. Or manually allow port 5000:
   - Open Windows Defender Firewall
   - Click "Advanced settings"
   - Click "Inbound Rules" → "New Rule"
   - Select "Port" → Next
   - Select "TCP" and enter port `5000`
   - Allow the connection
   - Apply to all profiles  

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

