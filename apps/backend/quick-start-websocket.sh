#!/bin/bash

# WebSocket Server - Quick Start Guide
# This script helps you get the WebSocket server up and running

echo "========================================================================"
echo "WebSocket Live Analysis Server - Quick Start"
echo "========================================================================"
echo ""

# Step 1: Check dependencies
echo "[STEP 1] Checking dependencies..."
cd /Users/hadyakram/Desktop/trustai/apps/backend

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Install from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Step 2: Check if required npm packages are installed
echo "[STEP 2] Checking npm packages..."

for package in ws axios form-data; do
    if npm list "$package" > /dev/null 2>&1; then
        echo "✅ $package is installed"
    else
        echo "⚠️  $package is not installed, installing..."
        npm install "$package" --save
    fi
done

echo ""

# Step 3: Start the WebSocket server
echo "[STEP 3] Starting WebSocket server..."
echo ""
echo "Server will listen on: ws://localhost:8080"
echo "Flask API target: http://localhost:8000"
echo "Buffer threshold: 5 audio chunks"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "========================================================================"
echo ""

node websocket-server.js
