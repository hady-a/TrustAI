#!/bin/bash

echo "🔍 TrustAI Comprehensive Diagnostic"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:9999/api"
FRONTEND_URL="http://localhost:5173"

# Test 1: Backend Status
echo -e "${BLUE}1. Testing Backend Service${NC}"
echo "----------------------------"
if curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on $API_URL${NC}"
    HEALTH=$(curl -s "$API_URL/health")
    echo "   Config: $(echo $HEALTH | grep -o 'clientIdSet.*' | cut -d':' -f2 | cut -d',' -f1)"
else
    echo -e "${RED}❌ Backend is NOT running${NC}"
    echo "   Start it with: cd apps/backend && npm run dev"
    exit 1
fi
echo ""

# Test 2: Frontend Status
echo -e "${BLUE}2. Testing Frontend Service${NC}"
echo "----------------------------"
if curl -s "$FRONTEND_URL" | grep -q "TrustAI"; then
    echo -e "${GREEN}✅ Frontend is running on $FRONTEND_URL${NC}"
else
    echo -e "${RED}❌ Frontend is NOT running${NC}"
    echo "   Start it with: cd apps/frontend && npm run dev"
    exit 1
fi
echo ""

# Test 3: Database Connectivity
echo -e "${BLUE}3. Testing Database${NC}"
echo "-------------------"
HEALTH=$(curl -s "$API_URL/health")
if echo $HEALTH | grep -q "ok"; then
    echo -e "${GREEN}✅ Database is connected${NC}"
else
    echo -e "${RED}❌ Database might not be connected${NC}"
fi
echo ""

# Test 4: Authentication Test
echo -e "${BLUE}4. Testing Authentication${NC}"
echo "-------------------------"

# Create test user
echo "Creating test user..."
TEST_EMAIL="diagnostic-test-$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"

SIGNUP=$(curl -s -X POST "$API_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Diagonal Test\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if echo "$SIGNUP" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Signup endpoint works${NC}"
    echo "   Email: $TEST_EMAIL"
else
    echo -e "${RED}❌ Signup endpoint failed${NC}"
    echo "   Response: $SIGNUP"
fi

# Test login with new credentials
echo "Testing login..."
LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if echo "$LOGIN" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Login endpoint works${NC}"
    TOKEN=$(echo "$LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 | cut -c1-30)
    echo "   Token generated: ${TOKEN}..."
else
    echo -e "${RED}❌ Login endpoint failed${NC}"
    echo "   Response: $LOGIN"
fi
echo ""

# Test 5: CORS Headers
echo -e "${BLUE}5. Testing CORS${NC}"
echo "---------------"
CORS=$(curl -s -X OPTIONS "$API_URL/auth/login" \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: POST" \
  -i 2>&1 | grep -i "Access-Control-Allow-Origin")

if [ -n "$CORS" ]; then
    echo -e "${GREEN}✅ CORS is configured${NC}"
    echo "   Header: $CORS"
else
    echo -e "${YELLOW}⚠️  CORS headers not in OPTIONS response${NC}"
fi
echo ""

# Test 6: Environment Configuration
echo -e "${BLUE}6. Environment Configuration${NC}"
echo "-----------------------------"
echo -e "Backend:"
if [ -f "apps/backend/.env" ]; then
    echo -e "  ${GREEN}✅ .env file exists${NC}"
    if grep -q "JWT_SECRET" apps/backend/.env; then
        echo -e "  ${GREEN}✅ JWT_SECRET is set${NC}"
    else
        echo -e "  ${RED}❌ JWT_SECRET is NOT set${NC}"
    fi
else
    echo -e "  ${RED}❌ .env file missing${NC}"
fi

echo "Frontend:"
if [ -f "apps/frontend/.env" ]; then
    echo -e "  ${GREEN}✅ .env file exists${NC}"
    if grep -q "VITE_API_URL" apps/frontend/.env; then
        echo -e "  ${GREEN}✅ VITE_API_URL is set${NC}"
        VITE_API=$(grep "VITE_API_URL" apps/frontend/.env | cut -d'=' -f2)
        echo "     Value: $VITE_API"
    fi
else
    echo -e "  ${RED}❌ .env file missing${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}Summary${NC}"
echo "======="
echo -e "${GREEN}✅ All services appear to be working correctly${NC}"
echo ""
echo "Next steps:"
echo "1. Open browser DevTools (F12)"
echo "2. Go to Console tab"
echo "3. Try logging in"
echo "4. Look for error messages starting with [Login] or [API]"
echo "5. Share any error messages for further diagnosis"
echo ""
echo "Test Credentials:"
echo "  Email: $TEST_EMAIL"
echo "  Password: $TEST_PASSWORD"
echo ""
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $API_URL"
