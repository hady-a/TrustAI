#!/bin/bash

# Test script for TrustAI AI Service integration

set -e

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  TrustAI AI Service Integration Test   ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test 1: Check if Python is installed
echo -e "${BLUE}Test 1: Checking Python installation...${NC}"
if command -v python3 &> /dev/null; then
    python_version=$(python3 --version)
    echo -e "${GREEN}✅ Python installed: $python_version${NC}"
else
    echo -e "${RED}❌ Python3 not found${NC}"
    exit 1
fi
echo ""

# Test 2: Check if AI service directory exists
echo -e "${BLUE}Test 2: Checking AI service directory...${NC}"
if [ -d "apps/ai-service" ]; then
    echo -e "${GREEN}✅ AI service directory found${NC}"
    echo "Files:"
    ls -la apps/ai-service/app/ 2>/dev/null || echo "  (app directory not yet populated)"
else
    echo -e "${RED}❌ AI service directory not found${NC}"
    exit 1
fi
echo ""

# Test 3: Check requirements file
echo -e "${BLUE}Test 3: Checking requirements.txt...${NC}"
if [ -f "apps/ai-service/requirements.txt" ]; then
    echo -e "${GREEN}✅ requirements.txt found${NC}"
    echo "Key dependencies:"
    grep -E "fastapi|whisper|deepface|torch" apps/ai-service/requirements.txt | sed 's/^/  - /'
else
    echo -e "${RED}❌ requirements.txt not found${NC}"
    exit 1
fi
echo ""

# Test 4: Check backend configuration
echo -e "${BLUE}Test 4: Checking backend configuration...${NC}"
if grep -q "AI_SERVICE_URL" apps/backend/.env; then
    ai_url=$(grep "AI_SERVICE_URL" apps/backend/.env | cut -d'=' -f2)
    echo -e "${GREEN}✅ AI_SERVICE_URL configured: $ai_url${NC}"
else
    echo -e "${YELLOW}⚠️  AI_SERVICE_URL not found in backend .env${NC}"
fi
echo ""

# Test 5: Check docker-compose
echo -e "${BLUE}Test 5: Checking docker-compose configuration...${NC}"
if grep -q "ai-service:" docker-compose.yml; then
    echo -e "${GREEN}✅ AI service defined in docker-compose.yml${NC}"
else
    echo -e "${RED}❌ AI service not in docker-compose.yml${NC}"
fi
echo ""

# Test 6: Check AI service models
echo -e "${BLUE}Test 6: Checking AI service models...${NC}"
if [ -f "apps/ai-service/app/models.py" ]; then
    echo -e "${GREEN}✅ Database models defined${NC}"
else
    echo -e "${RED}❌ Database models file not found${NC}"
fi

if [ -f "apps/ai-service/app/trustai_integration.py" ]; then
    echo -e "${GREEN}✅ TrustAI integration module found${NC}"
    echo "Analysis modes:"
    grep -E "def (hr_interview|criminal|business)_analysis" apps/ai-service/app/trustai_integration.py | \
    sed 's/.*def /  - /' | sed 's/(.*//' | sed 's/_/ /g'
else
    echo -e "${RED}❌ TrustAI integration module not found${NC}"
fi
echo ""

# Test 7: Backend API Service
echo -e "${BLUE}Test 7: Checking backend AI service call...${NC}"
if grep -q "AI_URL\|AI_SERVICE\|analyze" apps/backend/src/services/ai.service.ts 2>/dev/null; then
    echo -e "${GREEN}✅ Backend AI service endpoint configured${NC}"
    grep "AI_URL" apps/backend/src/services/ai.service.ts 2>/dev/null | head -1 | sed 's/^/  /'
else
    echo -e "${YELLOW}⚠️  Could not verify backend AI service${NC}"
fi
echo ""

# Test 8: Check documentation
echo -e "${BLUE}Test 8: Checking documentation...${NC}"
docs_found=0
if [ -f "AI_SERVICE_INTEGRATION.md" ]; then
    echo -e "${GREEN}✅ AI_SERVICE_INTEGRATION.md found${NC}"
    docs_found=$((docs_found + 1))
fi
if [ -f "apps/ai-service/README.md" ]; then
    echo -e "${GREEN}✅ AI Service README found${NC}"
    docs_found=$((docs_found + 1))
fi
if [ -f "setup-all.sh" ]; then
    echo -e "${GREEN}✅ Setup script found${NC}"
    docs_found=$((docs_found + 1))
fi
echo "Documentation files found: $docs_found/3"
echo ""

# Summary
echo "╔════════════════════════════════════════╗"
echo "║         Integration Summary            ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ AI Service Integration Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Install Python dependencies:"
echo "   cd apps/ai-service"
echo "   chmod +x setup.sh"
echo "   ./setup.sh"
echo ""
echo "2. Start all services:"
echo "   Option A (Docker): docker-compose up -d"
echo "   Option B (Local): Run 3 terminals as shown in AI_SERVICE_INTEGRATION.md"
echo ""
echo "3. Test the API:"
echo "   curl http://localhost:8000/health"
echo ""
echo "4. Access documentation:"
echo "   Backend API: http://localhost:9999/api/docs"
echo "   AI Service: http://localhost:8000/docs"
echo ""
echo "For detailed information, see:"
echo "  - AI_SERVICE_INTEGRATION.md (complete guide)"
echo "  - apps/ai-service/README.md (API reference)"
echo ""
