#!/bin/bash

# Flask API Startup Script for Production
# Uses Gunicorn for production deployment

echo "🚀 Starting TrustAI Flask API (Production)..."

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the script directory
cd "$SCRIPT_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ] && [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found. Please run start_flask_api.sh first."
    exit 1
fi

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
else
    source .venv/bin/activate
fi

# Load environment variables
if [ -f ".env.flask" ]; then
    export $(cat .env.flask | xargs)
fi

# Start with Gunicorn
WORKERS=${GUNICORN_WORKERS:-4}
PORT=${FLASK_PORT:-5000}

echo "✅ Starting Gunicorn with $WORKERS workers on port $PORT"
gunicorn -w $WORKERS -b 0.0.0.0:$PORT --timeout 120 flask_api:app
