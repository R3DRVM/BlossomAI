#!/bin/bash

# BlossomAI Ready Check Script
# Validates environment, build, and functionality before deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE=${VITE_API_BASE:-"http://localhost:5000"}
DEV_ORIGIN="http://localhost:5173"
PREVIEW_ORIGIN="https://blossomai-preview.vercel.app"
PROD_ORIGIN="https://blossomai.vercel.app"

echo -e "${BLUE}🔍 BlossomAI Ready Check${NC}"
echo "=================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check environment variables
check_env() {
    echo -e "${BLUE}📋 Environment Check${NC}"
    
    # Required variables
    local required_vars=("NODE_ENV" "PORT")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Missing required environment variables:${NC}"
        printf '   %s\n' "${missing_vars[@]}"
        return 1
    fi
    
    # Check CORS configuration
    if [[ "$NODE_ENV" == "production" ]]; then
        if [[ -z "$ALLOWED_ORIGINS" && -z "$ALLOWED_ORIGIN_REGEX_PREVIEW" ]]; then
            echo -e "${RED}❌ CORS configuration required for production${NC}"
            echo "   Set ALLOWED_ORIGINS or ALLOWED_ORIGIN_REGEX_PREVIEW"
            return 1
        fi
    fi
    
    echo -e "${GREEN}✅ Environment variables valid${NC}"
    return 0
}

# Function to check build
check_build() {
    echo -e "${BLUE}🔨 Build Check${NC}"
    
    if ! command_exists npm; then
        echo -e "${RED}❌ npm not found${NC}"
        return 1
    fi
    
    echo "   Building application..."
    if npm run build >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Build successful${NC}"
        return 0
    else
        echo -e "${RED}❌ Build failed${NC}"
        return 1
    fi
}

# Function to check provider health
check_providers() {
    echo -e "${BLUE}🌐 Provider Health Check${NC}"
    
    # Check if server is running
    if ! curl -s "$API_BASE/api/__debug/ping" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Server not running, starting dev server...${NC}"
        npm run dev &
        sleep 5
    fi
    
    # Test data endpoints
    local endpoints=(
        "/api/data/prices?symbols=USDC,WETH"
        "/api/data/yields?chain=solana&limit=5"
        "/api/data/tvl?chain=solana"
    )
    
    local failed=0
    for endpoint in "${endpoints[@]}"; do
        if curl -s "$API_BASE$endpoint" >/dev/null 2>&1; then
            echo -e "   ✅ $endpoint"
        else
            echo -e "   ❌ $endpoint"
            failed=1
        fi
    done
    
    if [[ $failed -eq 0 ]]; then
        echo -e "${GREEN}✅ All providers healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ Some providers failed${NC}"
        return 1
    fi
}

# Function to check CORS
check_cors() {
    echo -e "${BLUE}🔒 CORS Check${NC}"
    
    # Test allowed origin
    local origin
    case "$NODE_ENV" in
        "development")
            origin="$DEV_ORIGIN"
            ;;
        "preview")
            origin="$PREVIEW_ORIGIN"
            ;;
        "production")
            origin="$PROD_ORIGIN"
            ;;
        *)
            origin="$DEV_ORIGIN"
            ;;
    esac
    
    local response=$(curl -s -I "$API_BASE/api/__debug/ping" -H "Origin: $origin" 2>/dev/null)
    
    if echo "$response" | grep -q "Access-Control-Allow-Origin: $origin"; then
        echo -e "   ✅ Allowed origin: $origin"
    else
        echo -e "   ❌ CORS not configured for: $origin"
        return 1
    fi
    
    # Test disallowed origin
    local disallowed_response=$(curl -s -I "$API_BASE/api/__debug/ping" -H "Origin: https://not-allowed.example" 2>/dev/null)
    
    if echo "$disallowed_response" | grep -q "Access-Control-Allow-Origin"; then
        echo -e "   ❌ CORS allows disallowed origin"
        return 1
    else
        echo -e "   ✅ Disallowed origin blocked"
    fi
    
    echo -e "${GREEN}✅ CORS configuration valid${NC}"
    return 0
}

# Function to check chat functionality
check_chat() {
    echo -e "${BLUE}💬 Chat Functionality Check${NC}"
    
    local test_message='{"sessionId":"ready-check","messages":[{"role":"user","content":"Deploy all my USDC at the highest APY on Solana"}]}'
    
    local response=$(curl -s "$API_BASE/api/demo/chat" \
        -H "Content-Type: application/json" \
        -d "$test_message" 2>/dev/null)
    
    if [[ -n "$response" && "$response" != *"error"* ]]; then
        echo -e "   ✅ Chat endpoint responds"
        
        # Check for required fields
        if echo "$response" | grep -q "schemaVersion"; then
            echo -e "   ✅ Response includes schema version"
        else
            echo -e "   ❌ Response missing schema version"
            return 1
        fi
        
        if echo "$response" | grep -q "provenance"; then
            echo -e "   ✅ Response includes provenance"
        else
            echo -e "   ❌ Response missing provenance"
            return 1
        fi
    else
        echo -e "   ❌ Chat endpoint failed"
        return 1
    fi
    
    echo -e "${GREEN}✅ Chat functionality valid${NC}"
    return 0
}

# Function to check UI invariants
check_ui_invariants() {
    echo -e "${BLUE}🎨 UI Invariants Check${NC}"
    
    # Check that key UI files exist and haven't been modified
    local ui_files=(
        "client/src/pages/terminal.tsx"
        "client/src/components/terminal/StrategyBuilder.tsx"
        "client/src/components/terminal/YieldOverview.tsx"
        "client/src/components/terminal/Header.tsx"
    )
    
    local missing=0
    for file in "${ui_files[@]}"; do
        if [[ -f "$file" ]]; then
            echo -e "   ✅ $file exists"
        else
            echo -e "   ❌ $file missing"
            missing=1
        fi
    done
    
    if [[ $missing -eq 0 ]]; then
        echo -e "${GREEN}✅ UI files present${NC}"
        return 0
    else
        echo -e "${RED}❌ Some UI files missing${NC}"
        return 1
    fi
}

# Main execution
main() {
    local exit_code=0
    
    # Run all checks
    check_env || exit_code=1
    check_build || exit_code=1
    check_providers || exit_code=1
    check_cors || exit_code=1
    check_chat || exit_code=1
    check_ui_invariants || exit_code=1
    
    echo ""
    echo "=================================="
    
    if [[ $exit_code -eq 0 ]]; then
        echo -e "${GREEN}🎉 READY OK${NC}"
        echo "All checks passed. Application is ready for deployment."
    else
        echo -e "${RED}❌ READY FAILED${NC}"
        echo "Some checks failed. Please fix issues before deployment."
    fi
    
    # Cleanup
    if [[ -n "$(jobs -p)" ]]; then
        kill $(jobs -p) 2>/dev/null || true
    fi
    
    exit $exit_code
}

# Run main function
main "$@"

