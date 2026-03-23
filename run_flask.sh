#!/bin/bash

# TrustAI Flask API Startup Script (Development)
# Starts the Flask API server with automatic reload

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          TrustAI Flask API - Development Server                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Python path
PYTHON="/usr/local/bin/python3.10"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to Flask directory
FLASK_DIR="$SCRIPT_DIR/trust ai system"
cd "$FLASK_DIR"

# Load environment variables
if [ -f ".env.flask" ]; then
    export $(cat .env.flask | xargs)
fi

# Start Flask API
# Check Python installation
if [ ! -x "$PYTHON" ]; then
    echo -e "${RED}✗ Python not found at $PYTHON${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python found: $($PYTHON --version)${NC}"
echo ""

# Install Flask if needed
$PYTHON -m pip install -q flask flask-cors python-dotenv 2>/dev/null && echo -e "${GREEN}✓ Flask packages ready${NC}" || true

echo ""
echo "🚀 Starting Flask API..."
echo "📍 API will be available at: http://localhost:5000"
echo "📍 API Health Check: http://localhost:5000/api/health"
echo "📍 API Info: http://localhost:5000/api/info"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Create uploads directory
mkdir -p "$FLASK_DIR/uploads"

# Start Flask
export FLASK_ENV=development
export FLASK_DEBUG=true
export PYTHONUNBUFFERED=1

$PYTHON flask_api.py
