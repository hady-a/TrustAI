#!/bin/bash

# TrustAI Flask API Startup Script (Production)
# Uses Gunicorn for production deployment

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          TrustAI Flask API - Production Server                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
WORKERS=${WORKERS:-4}
PORT=${PORT:-5000}
PYTHON="/usr/local/bin/python3.10"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FLASK_DIR="$SCRIPT_DIR/trust ai system"

echo "📁 Flask Directory: $FLASK_DIR"
echo "⚙️  Workers: $WORKERS"
echo "🔌 Port: $PORT"
echo ""

# Check Python
if [ ! -x "$PYTHON" ]; then
    echo "✗ Python not found at $PYTHON"
    exit 1
fi

echo "✓ Python found: $($PYTHON --version)"

# Install Gunicorn if needed
$PYTHON -m pip install -q gunicorn > /dev/null 2>&1 && echo "✓ Gunicorn installed" || echo "⚠ Gunicorn install in progress..."

echo ""

# Create necessary directories
mkdir -p "$FLASK_DIR/uploads"
mkdir -p "$FLASK_DIR/logs"

echo ""
echo "🚀 Starting Flask API with Gunicorn..."
echo "📍 API available at: http://0.0.0.0:$PORT"
echo "📍 Workers: $WORKERS"
echo ""

# Change to Flask directory and start with Gunicorn
cd "$FLASK_DIR"
export FLASK_ENV=production
export PYTHONUNBUFFERED=1

# Start Gunicorn
exec $PYTHON -m gunicorn \
    --workers $WORKERS \
    --worker-class sync \
    --bind 0.0.0.0:$PORT \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --timeout 300 \
    flask_api:app
