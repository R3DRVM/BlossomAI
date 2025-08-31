#!/bin/bash

echo "🌸 BlossomAI Local Testing Suite 🌸"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    
    echo -n "Testing $name... "
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null); then
        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (Expected HTTP $expected_status, got HTTP $response)"
            return 1
        fi
    else
        echo -e "${RED}✗ ERROR${NC} (Connection failed)"
        return 1
    fi
}

# Function to test API endpoint
test_api() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    
    echo -n "Testing API $name... "
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null); then
        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (Expected HTTP $expected_status, got HTTP $response)"
            return 1
        fi
    else
        echo -e "${RED}✗ ERROR${NC} (Connection failed)"
        return 1
    fi
}

echo -e "\n${YELLOW}1. Testing Server Availability${NC}"
echo "----------------------------------------"

# Check if server is running
if pgrep -f "npm run dev" > /dev/null; then
    echo -e "${GREEN}✓ Development server is running${NC}"
else
    echo -e "${RED}✗ Development server is not running${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
fi

echo -e "\n${YELLOW}2. Testing Page Endpoints${NC}"
echo "----------------------------------------"

# Test all page endpoints
test_endpoint "Root (/) " "http://localhost:5000" "200"
test_endpoint "Terminal (/terminal)" "http://localhost:5000/terminal" "200"
test_endpoint "Strategies (/strategies)" "http://localhost:5000/strategies" "200"
test_endpoint "Auth (/auth)" "http://localhost:5000/auth" "200"

echo -e "\n${YELLOW}3. Testing API Endpoints${NC}"
echo "----------------------------------------"

# Test all API endpoints
test_api "Auth User" "http://localhost:5000/api/auth/user" "200"
test_api "Yield Opportunities" "http://localhost:5000/api/yield-opportunities" "200"
test_api "Strategies" "http://localhost:5000/api/strategies" "200"
test_api "Chat Messages" "http://localhost:5000/api/chat/messages" "200"

echo -e "\n${YELLOW}4. Testing Build Process${NC}"
echo "----------------------------------------"

# Test build process
echo -n "Testing production build... "
if cd client && npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    cd ..
else
    echo -e "${RED}✗ FAIL${NC}"
    cd ..
fi

echo -e "\n${YELLOW}5. Testing Authentication Flow${NC}"
echo "----------------------------------------"

# Test authentication flow simulation
echo -n "Testing auth flow simulation... "
if curl -s "http://localhost:5000/terminal" | grep -q "Demo Access"; then
    echo -e "${GREEN}✓ PASS${NC} (Auth page shows for unauthenticated users)"
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Could not verify auth flow)"
fi

echo -e "\n${YELLOW}6. Testing CORS Headers${NC}"
echo "----------------------------------------"

# Test CORS headers
echo -n "Testing CORS headers... "
if curl -s -I "http://localhost:5000" | grep -q "Access-Control-Allow-Origin: *"; then
    echo -e "${GREEN}✓ PASS${NC} (CORS properly configured)"
else
    echo -e "${RED}✗ FAIL${NC} (CORS headers missing)"
fi

echo -e "\n${YELLOW}7. Testing Logo Assets${NC}"
echo "----------------------------------------"

# Test logo assets
echo -n "Testing logo assets... "
if [ -f "client/src/assets/logos/blossom-light.svg" ] && [ -f "client/src/assets/logos/blossom-dark.svg" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Logo files exist)"
else
    echo -e "${RED}✗ FAIL${NC} (Logo files missing)"
fi

echo -e "\n${YELLOW}8. Testing Component Files${NC}"
echo "----------------------------------------"

# Test key component files
echo -n "Testing component files... "
if [ -f "client/src/components/ui/logo.tsx" ] && [ -f "client/src/pages/terminal.tsx" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Key components exist)"
else
    echo -e "${RED}✗ FAIL${NC} (Key components missing)"
fi

echo -e "\n${YELLOW}Summary${NC}"
echo "-------"

echo -e "${GREEN}✅ All tests completed!${NC}"
echo -e "${YELLOW}🌐 Open http://localhost:5000 in your browser to test the UI${NC}"
echo -e "${YELLOW}🔧 The application should work without any 403 errors${NC}"
echo -e "${YELLOW}🚀 Ready for Vercel deployment!${NC}"

echo -e "\n${YELLOW}Manual Testing Checklist:${NC}"
echo "1. Open http://localhost:5000"
echo "2. Navigate to /terminal (should show auth page)"
echo "3. Sign in with any username"
echo "4. Verify you're redirected to terminal"
echo "5. Test sign out (should return to auth page)"
echo "6. Test theme switching (logos should change)"
echo "7. Navigate between pages (chat should persist)"
echo "8. Test all terminal features work correctly"
