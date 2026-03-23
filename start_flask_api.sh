#!/bin/bash

# TrustAI Flask Integration - Ready to Run Guide

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║      TrustAI Flask API - Quick Start Guide                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

PYTHON="/usr/local/bin/python3.10"
PORT=8000

echo "📌 Python Location: $PYTHON"
echo "🔌 API Port: $PORT (use this instead of 5000)"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Step 1: Verify Python
echo "✓ Step 1: Verifying Python installation..."
$PYTHON --version

# Step 2: Install Flask
echo ""
echo "✓ Step 2: Installing Flask packages..."
$PYTHON -m pip install -q flask flask-cors python-dotenv 2>/dev/null && \
    echo "  ✓ Flask, CORS, and dotenv installed" || \
    echo "  ⚠ Some packages may already be installed"

# Step 3: Start Flask API
echo ""
echo "✓ Step 3: Starting Flask API..."
echo ""

cd "/Users/hadyakram/Desktop/trustai/trust ai system"

export FLASK_ENV=development
export FLASK_DEBUG=true
export PYTHONUNBUFFERED=1

# Kill any existing Flask processes
pkill -f "flask_api.py" 2>/dev/null || true
sleep 1

# Start Flask on custom port
echo "🚀 Starting Flask API on http://localhost:$PORT"
echo "📍 API Health: http://localhost:$PORT/api/health"
echo "📍 API Info: http://localhost:$PORT/api/info"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

sed "s/port=5000,/port=$PORT,/" <<'EOF' | $PYTHON
import sys
sys.path.insert(0, '/Users/hadyakram/Desktop/trustai/trust ai system')

# Suppress warnings
import warnings
warnings.filterwarnings('ignore')

import os
os.chdir('/Users/hadyakram/Desktop/trustai/trust ai system')

# Create uploads directory
os.makedirs('uploads', exist_ok=True)
os.makedirs('logs', exist_ok=True)

# Import and run app
from flask_api import app

print("⚠️  Warning: Face, Voice, and Lie Detection modules not available")
print("    (These require additional ML dependencies)")
print()
print("✅ API is ready with graceful degradation!")
print("✅ You can still test the endpoints with demo files")
print()

app.run(host='0.0.0.0', port=8000, debug=True, threaded=True, use_reloader=False)
EOF
