#!/bin/bash

# Start TrustAI Development Environment
# Starts Backend and Frontend

set -e

TRUSTAI_ROOT="/Users/hadyakram/Desktop/trustai"
PIDS=()

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down TrustAI services...${NC}"
    for pid in "${PIDS[@]}"; do
        kill $pid 2>/dev/null || true
    done
    echo -e "${GREEN}✅ All services stopped${NC}"
}

trap cleanup EXIT INT TERM

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  TrustAI Development Environment       ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Start Backend
echo -e "${BLUE}🔧 Starting Backend on port 9999...${NC}"
cd "$TRUSTAI_ROOT/apps/backend"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install --silent
fi
npm run dev &
BACKEND_PID=$!
PIDS+=($BACKEND_PID)
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo "   Run: npm run dev (in another terminal)"
echo ""

# Start Frontend
echo -e "${BLUE}⚛️  Starting Frontend on port 5173...${NC}"
cd "$TRUSTAI_ROOT/apps/frontend"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install --silent
fi
npm run dev &
FRONTEND_PID=$!
PIDS+=($FRONTEND_PID)
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo ""

echo "╔════════════════════════════════════════╗"
echo "║  🚀 TrustAI is Running!                 ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Services available at:"
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:9999"
echo ""
echo "API Documentation:"
echo "  Backend:   http://localhost:9999/api/docs"
echo ""
echo "Service Status:"
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running
wait
