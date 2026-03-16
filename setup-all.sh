#!/bin/bash

# TrustAI Complete Setup and Run Script
# Integrates Backend, Frontend, and AI Service

set -e  # Exit on error

echo ""
echo "╔════════════════════════════════════════╗"
echo "║      TrustAI System Complete Setup     ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠️  Docker is not installed. Using local setup instead.${NC}"
        return 1
    fi
    return 0
}

# Option 1: Docker Setup
setup_docker() {
    echo -e "${BLUE}📦 Setting up with Docker...${NC}"
    
    if ! check_docker; then
        echo "Docker is required for this option"
        return 1
    fi
    
    echo "Building images..."
    docker-compose build
    
    echo "Starting services..."
    docker-compose up -d
    
    echo -e "${GREEN}✅ All services started!${NC}"
    echo ""
    echo "Services running at:"
    echo "  Frontend: http://localhost:5173"
    echo "  Backend:  http://localhost:5000"
    echo "  AI Service: http://localhost:8000"
    echo ""
    echo "View logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "Stop services:"
    echo "  docker-compose down"
}

# Option 2: Local Setup
setup_local() {
    echo -e "${BLUE}🚀 Setting up locally...${NC}"
    echo ""
    
    # Backend
    echo -e "${BLUE}Setting up Backend...${NC}"
    cd apps/backend
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    echo -e "${GREEN}✅ Backend ready${NC}"
    cd ../..
    echo ""
    
    # Frontend
    echo -e "${BLUE}Setting up Frontend...${NC}"
    cd apps/frontend
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    echo -e "${GREEN}✅ Frontend ready${NC}"
    cd ../..
    echo ""
    
    # AI Service
    echo -e "${BLUE}Setting up AI Service...${NC}"
    cd apps/ai-service
    chmod +x setup.sh
    ./setup.sh
    echo -e "${GREEN}✅ AI Service ready${NC}"
    cd ../..
    echo ""
    
    echo -e "${GREEN}✅ All setup complete!${NC}"
    echo ""
    echo "To start services, run in separate terminals:"
    echo "  Backend: cd apps/backend && npm run dev"
    echo "  Frontend: cd apps/frontend && npm run dev"
    echo "  AI Service: cd apps/ai-service && source venv/bin/activate && python -m uvicorn app.main:app --reload"
}

# Option 3: Run all locally
run_local() {
    echo -e "${BLUE}🚀 Starting services locally...${NC}"
    echo ""
    echo "⚠️  Make sure to run this in separate terminals:"
    echo ""
    
    # Start Backend
    echo "Terminal 1 - Backend:"
    echo "  cd apps/backend && npm run dev"
    echo ""
    
    # Start Frontend  
    echo "Terminal 2 - Frontend:"
    echo "  cd apps/frontend && npm run dev"
    echo ""
    
    # Start AI Service
    echo "Terminal 3 - AI Service:"
    echo "  cd apps/ai-service"
    echo "  source venv/bin/activate"
    echo "  python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    echo ""
    
    echo -e "${GREEN}Services will be available at:${NC}"
    echo "  Frontend: http://localhost:5173"
    echo "  Backend:  http://localhost:5000"
    echo "  API Docs: http://localhost:5000/api/docs"
    echo "  AI Service: http://localhost:8000"
    echo "  AI Service Docs: http://localhost:8000/docs"
}

# Main menu
echo "Choose setup option:"
echo ""
echo "1. Docker Compose (Recommended)"
echo "2. Local Setup"
echo "3. Show Local Run Commands"
echo "4. Exit"
echo ""
read -p "Enter option (1-4): " option

case $option in
    1)
        setup_docker
        ;;
    2)
        setup_local
        ;;
    3)
        run_local
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac
