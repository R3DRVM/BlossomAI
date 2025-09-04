#!/bin/bash

echo "=== CORS Probe Script ==="
echo "Testing CORS configuration with various origins"
echo ""

echo "=== ECHO from localhost, 127, ::1 ==="
for O in "http://localhost:5001" "http://127.0.0.1:5001" "http://[::1]:5001"; do
  echo "--- Origin: $O"
  curl -s -H "Origin: $O" http://127.0.0.1:5050/api/cors/echo || true
  echo ""
done

echo "=== Chat JSON with each origin ==="
for O in "http://localhost:5001" "http://127.0.0.1:5001" "http://[::1]:5001"; do
  echo "--- Origin: $O"
  curl -s -i -H "Origin: $O" -H "Content-Type: application/json" \
    -X POST --data '{"sessionId":"dev","message":"hello"}' \
    http://127.0.0.1:5050/api/demo/chat | head -20
  echo ""
done

echo "=== Health check with each origin ==="
for O in "http://localhost:5001" "http://127.0.0.1:5001" "http://[::1]:5001"; do
  echo "--- Origin: $O"
  curl -s -i -H "Origin: $O" http://127.0.0.1:5050/api/demo/health | head -10
  echo ""
done

echo "=== 403 Debug Endpoint ==="
curl -s http://127.0.0.1:5050/api/debug/403s | jq . || echo "Failed to fetch 403 records"
echo ""

echo "=== Probe Complete ==="




