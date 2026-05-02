#!/bin/bash

# WebSocket Live Analysis Server - Startup Script
# Starts the WebSocket server for live audio analysis

set -e

echo "========================================================================"
echo "TrustAI - WebSocket Live Analysis Server"
echo "========================================================================"
echo ""

cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[SETUP] Installing dependencies..."
    npm install
fi

# Check required dependencies
echo "[CHECK] Verifying required dependencies..."
npm list ws > /dev/null 2>&1 || (echo "[INSTALL] Installing ws..." && npm install ws)
npm list axios > /dev/null 2>&1 || (echo "[INSTALL] Installing axios..." && npm install axios)
npm list form-data > /dev/null 2>&1 || (echo "[INSTALL] Installing form-data..." && npm install form-data)

echo ""
echo "========================================================================"
echo "Server Configuration"
echo "========================================================================"
echo "WebSocket Port:     8080"
echo "Flask API URL:      http://localhost:8000"
echo "Buffer Threshold:   5 audio chunks"
echo ""

echo "========================================================================"
echo "Starting WebSocket Server..."
echo "========================================================================"
echo ""

# Start server
node websocket-server.js

echo ""
echo "Server stopped."
