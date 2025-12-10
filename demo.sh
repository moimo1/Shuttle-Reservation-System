#!/bin/bash
# Offline Demo Script for Mac/Linux
# This script sets up and starts the Shuttle Reservation System for offline demo

echo "=== Shuttle Reservation System - Offline Demo Setup ==="
echo ""

# Check if MongoDB is running
echo "Checking MongoDB..."
if command -v mongosh &> /dev/null || command -v mongo &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        echo "MongoDB is running ✓"
    else
        echo "Starting MongoDB..."
        if command -v brew &> /dev/null; then
            brew services start mongodb-community 2>/dev/null || echo "Please start MongoDB manually"
        elif command -v systemctl &> /dev/null; then
            sudo systemctl start mongodb 2>/dev/null || echo "Please start MongoDB manually"
        else
            echo "Please start MongoDB manually"
        fi
        sleep 3
    fi
else
    echo "Warning: MongoDB not found. Please install MongoDB first."
    echo "macOS: brew install mongodb-community"
    echo "Linux: sudo apt-get install mongodb"
    read -p "Continue anyway? (y/n) " continue
    if [ "$continue" != "y" ]; then
        exit
    fi
fi

# Check if .env file exists
echo ""
echo "Checking environment configuration..."
if [ ! -f "app/backend/.env" ]; then
    echo ".env file not found. Creating from template..."
    if [ -f "app/backend/.env.example" ]; then
        cp app/backend/.env.example app/backend/.env
    else
        cat > app/backend/.env << EOF
MONGO_URI=mongodb://localhost:27017/shuttle-reservation
PORT=5000
JWT_SECRET=demo-secret-key-change-in-production
EOF
    fi
    echo ".env file created ✓"
else
    echo ".env file exists ✓"
fi

# Check if node_modules exist
echo ""
echo "Checking dependencies..."
if [ ! -d "app/backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd app/backend
    npm install
    cd ../..
fi

if [ ! -d "app/frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd app/frontend
    npm install
    cd ../..
fi

echo "Dependencies installed ✓"

# Seed database
echo ""
echo "Seeding database with demo data..."
cd app/backend
npm run seed
if [ $? -ne 0 ]; then
    echo "Error seeding database. Please check MongoDB connection."
    cd ../..
    exit 1
fi
cd ../..
echo "Database seeded ✓"

# Display demo credentials
echo ""
echo "=== Demo Login Credentials ==="
echo "Passenger: ava@example.com / password123"
echo "Passenger: maya@example.com / password123"
echo "Driver: liam@example.com / password123"
echo "Driver: noah@example.com / password123"
echo ""

# Start backend server in background
echo "Starting backend server..."
cd app/backend
npm run dev &
BACKEND_PID=$!
cd ../..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start frontend
echo ""
echo "Starting frontend..."
echo "Press 'w' to open in web browser, 'a' for Android, 'i' for iOS"
echo ""
cd app/frontend
npm start

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT

