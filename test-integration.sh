#!/bin/bash

# TrustAI Flask Integration - Testing & Verification Script
# This script validates all components are working correctly

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          TrustAI Flask Integration - Test Suite                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

# Test function
test_case() {
    local test_name=$1
    local command=$2
    
    echo -n "Testing: $test_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
}

echo -e "${BLUE}=== ENVIRONMENT CHECKS ===${NC}"
echo ""

# Python check
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1)
    echo -e "${GREEN}✓ Python${NC}: $PYTHON_VERSION"
    ((PASSED++))
else
    echo -e "${RED}✗ Python${NC}: Not found"
    ((FAILED++))
fi

# Node check
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js${NC}: $NODE_VERSION"
    ((PASSED++))
else
    echo -e "${RED}✗ Node.js${NC}: Not found"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}=== DEPENDENCY CHECKS ===${NC}"
echo ""

# Flask check
test_case "Flask installation" "python3 -c 'import flask; print(flask.__version__)'"

# Flask-CORS check
test_case "Flask-CORS installation" "python3 -c 'import flask_cors; print(flask_cors.__version__)'"

# Axios check (for backend)
test_case "axios available" "npm ls axios 2>/dev/null | grep -q axios"

# Multer check (for backend)
test_case "multer available" "npm ls multer 2>/dev/null | grep -q multer"

echo ""
echo -e "${BLUE}=== AI MODULE CHECKS ===${NC}"
echo ""

# AI modules check
test_case "Face Analysis module" "python3 -c 'from modules.face_module import FaceAnalyzer'"
test_case "Voice Analysis module" "python3 -c 'from modules.voice_module import VoiceAnalyzer'"
test_case "Lie Detection module" "python3 -c 'from modules.lie_module import LieDetector'"
test_case "Report Generation module" "python3 -c 'from modules.report_module import ReportGenerator'"

echo ""
echo -e "${BLUE}=== FILE EXISTENCE CHECKS ===${NC}"
echo ""

# File checks
test_case "flask_api.py exists" "test -f \"trust ai system/flask_api.py\""
test_case "config.py exists" "test -f \"trust ai system/config.py\""
test_case "requirements.txt exists" "test -f \"trust ai system/requirements.txt\""
test_case "trustai-client.js exists" "test -f \"apps/frontend/src/services/trustai-client.js\""
test_case "trustai-demo.html exists" "test -f \"apps/frontend/public/trustai-demo.html\""
test_case "FlaskAIService.ts exists" "test -f \"apps/backend/src/services/FlaskAIService.ts\""
test_case "analysisController.ts exists" "test -f \"apps/backend/src/controllers/analysisController.ts\""

echo ""
echo -e "${BLUE}=== DIRECTORY CHECKS ===${NC}"
echo ""

# Directory checks
test_case "uploads directory" "test -d \"trust ai system/uploads\""
test_case "modules directory" "test -d \"trust ai system/modules\""
test_case "frontend services directory" "test -d \"apps/frontend/src/services\""
test_case "backend services directory" "test -d \"apps/backend/src/services\""

echo ""
echo -e "${BLUE}=== STATIC ANALYSIS ===${NC}"
echo ""

# Code quality checks
test_case "flask_api.py has POST endpoints" "grep -q 'POST /api/analyze' trust\ ai\ system/flask_api.py"
test_case "flask_api.py has CORS" "grep -q 'CORS(app' trust\ ai\ system/flask_api.py"
test_case "trustai-client.js has analyzeBusinessMode" "grep -q 'analyzeBusinessMode' apps/frontend/src/services/trustai-client.js"
test_case "FlaskAIService.ts has analyzeBusinessMode" "grep -q 'analyzeBusinessMode' apps/backend/src/services/FlaskAIService.ts"

echo ""
echo -e "${BLUE}=== SUMMARY ===${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Coverage: $PERCENTAGE%"

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}            ✓ All Tests Passed - Ready to Deploy!              ${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
else
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}        ⚠ Some tests failed - Please check above             ${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
fi

echo ""
echo -e "${BLUE}=== NEXT STEPS ===${NC}"
echo ""
echo "1. Start Flask API:"
echo "   ./run_flask.sh"
echo ""
echo "2. Test API health:"
echo "   curl http://localhost:5000/api/health"
echo ""
echo "3. Test with demo:"
echo "   Open apps/frontend/public/trustai-demo.html in browser"
echo ""
echo "4. Integrate with your app:"
echo "   import TrustAIClient from './services/trustai-client.js'"
echo ""

exit $FAILED
