#!/bin/bash

# AI Service Installation and Setup Script

echo "================================"
echo "TrustAI AI Service Setup"
echo "================================"

# Check Python version
python3 --version

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create necessary directories
mkdir -p logs
mkdir -p temp

echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "To start the service, run:"
echo "  source venv/bin/activate"
echo "  python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "Or use Docker:"
echo "  docker build -t trustai-ai-service ."
echo "  docker run -p 8000:8000 trustai-ai-service"
