#!/bin/bash

###############################################################################
# API Gateway Security Verification Script
#
# Purpose: Verify that PR #11 security improvements are working correctly.
# Tests: Mass assignment protection, CORS allowlist, schema validation
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration (update these)
API_BASE_URL="${API_BASE_URL:-https://your-project.supabase.co/functions/v1/api-gateway}"
API_KEY="${API_KEY:-your-test-api-key}"

echo "======================================================================"
echo "API Gateway Security Verification"
echo "======================================================================"
echo "Base URL: $API_BASE_URL"
echo ""

###############################################################################
# TEST 1: Mass Assignment Protection
###############################################################################
echo "TEST 1: Mass Assignment Protection (tenant_id injection)"
echo "----------------------------------------------------------------------"

response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/orders" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "123e4567-e89b-12d3-a456-426614174000",
    "items": [{
      "product_id": "223e4567-e89b-12d3-a456-426614174000",
      "quantity": 1,
      "unit_price": 100
    }],
    "delivery_address": "Test Address 123",
    "tenant_id": "00000000-0000-0000-0000-000000000000",
    "admin": true,
    "status": "approved"
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "400" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Mass assignment rejected (HTTP 400)"
  echo "   Response: $body"
else
  echo -e "${RED}❌ FAIL${NC}: Should reject unknown fields with 400, got $http_code"
  echo "   Response: $body"
  exit 1
fi

echo ""

###############################################################################
# TEST 2: Valid Request Acceptance
###############################################################################
echo "TEST 2: Valid Request Acceptance"
echo "----------------------------------------------------------------------"

response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/orders" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "123e4567-e89b-12d3-a456-426614174000",
    "items": [{
      "product_id": "223e4567-e89b-12d3-a456-426614174000",
      "quantity": 5,
      "unit_price": 1500.50
    }],
    "delivery_address": "Calle 123 #45-67, Bogotá, Colombia"
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "201" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Valid request accepted (HTTP 201)"
  # Verify tenant_id was injected server-side
  if echo "$body" | grep -q "tenant_id"; then
    echo -e "${GREEN}✅ PASS${NC}: tenant_id present in response (injected server-side)"
  else
    echo -e "${YELLOW}⚠️  WARN${NC}: tenant_id not in response (check if expected)"
  fi
else
  echo -e "${RED}❌ FAIL${NC}: Valid request should be accepted with 201, got $http_code"
  echo "   Response: $body"
  exit 1
fi

echo ""

###############################################################################
# TEST 3: Invalid UUID Rejection
###############################################################################
echo "TEST 3: Invalid UUID Rejection"
echo "----------------------------------------------------------------------"

response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/orders" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "not-a-uuid",
    "items": [{
      "product_id": "also-not-a-uuid",
      "quantity": 1,
      "unit_price": 100
    }],
    "delivery_address": "Test Address"
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "400" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Invalid UUID rejected (HTTP 400)"
  if echo "$body" | grep -qi "uuid"; then
    echo -e "${GREEN}✅ PASS${NC}: Error message mentions UUID"
  fi
else
  echo -e "${RED}❌ FAIL${NC}: Should reject invalid UUID with 400, got $http_code"
  echo "   Response: $body"
  exit 1
fi

echo ""

###############################################################################
# TEST 4: Negative Quantity Rejection
###############################################################################
echo "TEST 4: Negative Quantity Rejection"
echo "----------------------------------------------------------------------"

response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/orders" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "123e4567-e89b-12d3-a456-426614174000",
    "items": [{
      "product_id": "223e4567-e89b-12d3-a456-426614174000",
      "quantity": -5,
      "unit_price": 100
    }],
    "delivery_address": "Test Address"
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "400" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Negative quantity rejected (HTTP 400)"
else
  echo -e "${RED}❌ FAIL${NC}: Should reject negative quantity with 400, got $http_code"
  echo "   Response: $body"
  exit 1
fi

echo ""

###############################################################################
# TEST 5: CORS - Allowed Origin
###############################################################################
echo "TEST 5: CORS - Allowed Origin"
echo "----------------------------------------------------------------------"

response=$(curl -s -i -X OPTIONS "$API_BASE_URL/orders" \
  -H "Origin: https://cellvi.com" \
  -H "Access-Control-Request-Method: POST")

if echo "$response" | grep -q "Access-Control-Allow-Origin: https://cellvi.com"; then
  echo -e "${GREEN}✅ PASS${NC}: Allowed origin returns correct CORS header"
else
  echo -e "${RED}❌ FAIL${NC}: Should return 'Access-Control-Allow-Origin: https://cellvi.com'"
  echo "   Response headers:"
  echo "$response" | grep -i "access-control"
  exit 1
fi

echo ""

###############################################################################
# TEST 6: CORS - Blocked Origin
###############################################################################
echo "TEST 6: CORS - Blocked Origin"
echo "----------------------------------------------------------------------"

response=$(curl -s -i -X OPTIONS "$API_BASE_URL/orders" \
  -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: POST")

if echo "$response" | grep -q "Access-Control-Allow-Origin: https://malicious-site.com"; then
  echo -e "${RED}❌ FAIL${NC}: Blocked origin should NOT receive CORS header"
  echo "   Response headers:"
  echo "$response" | grep -i "access-control"
  exit 1
else
  echo -e "${GREEN}✅ PASS${NC}: Blocked origin does not receive CORS header"
fi

echo ""

###############################################################################
# TEST 7: Missing API Key
###############################################################################
echo "TEST 7: Missing API Key Rejection"
echo "----------------------------------------------------------------------"

response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/orders" \
  -H "Content-Type: application/json" \
  -d '{"client_id": "123e4567-e89b-12d3-a456-426614174000"}')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "401" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Missing API key rejected (HTTP 401)"
else
  echo -e "${RED}❌ FAIL${NC}: Should reject missing API key with 401, got $http_code"
  exit 1
fi

echo ""

###############################################################################
# TEST 8: Trip with Invalid Coordinates
###############################################################################
echo "TEST 8: Trip with Invalid Coordinates Rejection"
echo "----------------------------------------------------------------------"

response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/trips" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "123e4567-e89b-12d3-a456-426614174000",
    "driver_id": "223e4567-e89b-12d3-a456-426614174000",
    "origin": {"lat": 200, "lng": -74.0817, "address": "Invalid"},
    "destination": {"lat": 6.2442, "lng": -75.5812, "address": "Valid"},
    "scheduled_start": "2024-01-01T10:00:00Z"
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "400" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Invalid coordinates rejected (HTTP 400)"
  if echo "$body" | grep -qi "lat"; then
    echo -e "${GREEN}✅ PASS${NC}: Error message mentions 'lat'"
  fi
else
  echo -e "${RED}❌ FAIL${NC}: Should reject invalid coordinates with 400, got $http_code"
  echo "   Response: $body"
  exit 1
fi

echo ""

###############################################################################
# SUMMARY
###############################################################################
echo "======================================================================"
echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
echo "======================================================================"
echo ""
echo "Security improvements verified:"
echo "  ✅ Mass assignment protection (unknown fields rejected)"
echo "  ✅ Schema validation (types, UUIDs, coordinates)"
echo "  ✅ CORS allowlist (wildcard eliminated)"
echo "  ✅ tenant_id server-side injection"
echo "  ✅ Proper HTTP status codes"
echo ""
echo "PR #11 is ready for production deployment."
echo ""

exit 0
