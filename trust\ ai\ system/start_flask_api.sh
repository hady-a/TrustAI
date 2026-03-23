#!/bin/bash

# Flask API Startup Script for TrustAI
# This script starts the Flask API server that integrates the Python AI model with the backend

echo "🚀 Starting TrustAI Flask API..."

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the script directory
cd "$SCRIPT_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ] && [ ! -d ".venv" ]; then
    echo "⚠️  Virtual environment not found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
else
    # Activate virtual environment
    if [ -d "venv" ]; then
        source venv/bin/activate
    else
        source .venv/bin/activate
    fi
fi

# Load environment variables
if [ -f ".env.flask" ]; then
    export $(cat .env.flask | xargs)
fi

# Start Flask API
echo "✅ Flask API starting on http://0.0.0.0:${FLASK_PORT:-5000}"
python flask_api.py
