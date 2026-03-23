#!/bin/bash

# TrustAI - Flask AI API Integration Setup Script
# This script sets up the Flask API and integrates it with the backend

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     TrustAI - Flask AI API Integration Setup                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

TRUSTAI_DIR="/Users/hadyakram/Desktop/trustai"
FLASK_DIR="$TRUSTAI_DIR/trust ai system"
BACKEND_DIR="$TRUSTAI_DIR/apps/backend"

# Check if directories exist
if [ ! -d "$FLASK_DIR" ]; then
    echo "❌ Error: Flask AI system directory not found at: $FLASK_DIR"
    exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Error: Backend directory not found at: $BACKEND_DIR"
    exit 1
fi

# ============================================================================
# Step 1: Setup Flask AI API
# ============================================================================

echo ""
echo "📦 Step 1: Setting up Flask AI API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$FLASK_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ] && [ ! -d ".venv" ]; then
    echo "⚙️  Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "✅ Virtual environment created"
else
    if [ -d "venv" ]; then
        source venv/bin/activate
    else
        source .venv/bin/activate
    fi
    echo "✅ Virtual environment already exists"
fi

# Install/upgrade pip and setuptools
echo "⚙️  Upgrading pip and setuptools..."
pip install --upgrade pip setuptools wheel > /dev/null 2>&1

# Install/update Flask requirements
if [ -f "requirements.txt" ]; then
    echo "⚙️  Installing Python dependencies..."
    pip install -r requirements.txt > /dev/null 2>&1
    echo "✅ Python dependencies installed"
else
    echo "⚠️  requirements.txt not found, skipping dependency installation"
fi

# Create .env.flask if it doesn't exist
if [ ! -f ".env.flask" ]; then
    echo "⚙️  Creating Flask configuration (.env.flask)..."
    cat > .env.flask << 'EOF'
# Flask API Configuration
FLASK_PORT=5000
FLASK_DEBUG=True
FLASK_ENV=development

# Upload settings
MAX_FILE_SIZE_MB=50

# AI Model Configuration
DEFAULT_REPORT_TYPE=general
VIDEO_DURATION_SECONDS=5
EOF
    echo "✅ Flask configuration created at .env.flask"
else
    echo "✅ Flask configuration already exists"
fi

echo "✅ Flask AI API setup complete"

# ============================================================================
# Step 2: Setup Backend Integration
# ============================================================================

echo ""
echo "🔧 Step 2: Setting up backend integration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$BACKEND_DIR"

# Install backend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "⚙️  Installing backend dependencies..."
    npm install > /dev/null 2>&1
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend dependencies already installed"
fi

# Create .env if it doesn't exist with Flask config
if [ ! -f ".env" ]; then
    echo "⚙️  Creating backend configuration (.env)..."
    
    # Ask for critical values
    read -p "Enter your DATABASE_URL (or press Enter for postgres://localhost/trustai): " DATABASE_URL
    DATABASE_URL=${DATABASE_URL:-"postgresql://localhost/trustai"}
    
    read -p "Enter your JWT_SECRET (or press Enter to generate one): " JWT_SECRET
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -base64 32)
        echo "   Generated JWT_SECRET: $JWT_SECRET"
    fi
    
    cat > .env << EOF
# Database
DATABASE_URL=$DATABASE_URL

# Authentication
JWT_SECRET=$JWT_SECRET

# Flask AI API Configuration
FLASK_API_URL=http://localhost:5000
FLASK_API_TIMEOUT=120000

# Server
PORT=9999
NODE_ENV=development

# Optional: Add other configuration here
EOF
    
    echo "✅ Backend configuration created at .env"
else
    echo "✅ Backend configuration already exists"
    
    # Check if FLASK_API_URL is in .env
    if ! grep -q "FLASK_API_URL" .env; then
        echo "⚠️  FLASK_API_URL not found in .env, adding it..."
        echo "" >> .env
        echo "# Flask AI API Configuration" >> .env
        echo "FLASK_API_URL=http://localhost:5000" >> .env
        echo "FLASK_API_TIMEOUT=120000" >> .env
        echo "✅ Added Flask API configuration to .env"
    else
        echo "✅ Flask API configuration already in .env"
    fi
fi

echo "✅ Backend integration setup complete"

# ============================================================================
# Step 3: Verify Setup
# ============================================================================

echo ""
echo "✅ Step 3: Verifying setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Flask files
if [ -f "$FLASK_DIR/flask_api.py" ]; then
    echo "✅ Flask API file exists"
else
    echo "❌ Flask API file not found"
fi

# Check AI service file
if [ -f "$BACKEND_DIR/src/services/ai.service.ts" ]; then
    echo "✅ AI Service file exists"
else
    echo "❌ AI Service file not found"
fi

# Check middleware file
if [ -f "$BACKEND_DIR/src/middleware/flaskAPIHealth.middleware.ts" ]; then
    echo "✅ Flask health check middleware exists"
else
    echo "❌ Flask health check middleware not found"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   Setup Complete! 🎉                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"

echo ""
echo "📖 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Start the Flask API server:"
echo "   cd \"$TRUSTAI_DIR\""
echo "   bash run_flask.sh"
echo ""
echo "2️⃣  In another terminal, verify Flask is running:"
echo "   curl http://localhost:5000/health"
echo ""
echo "3️⃣  Start the backend server:"
echo "   cd \"$BACKEND_DIR\""
echo "   npm run dev"
echo ""
echo "4️⃣  Start the frontend:"
echo "   cd \"$TRUSTAI_DIR/apps/frontend\""
echo "   npm run dev"
echo ""
echo "📚 Documentation:"
echo "   See $TRUSTAI_DIR/FLASK_INTEGRATION_GUIDE.md for detailed integration guide"
echo ""

# Ask if user wants to start Flask now
read -p "Would you like to start the Flask API now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Starting Flask API..."
    cd "$TRUSTAI_DIR"
    bash run_flask.sh
fi
