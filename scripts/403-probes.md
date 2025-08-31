# 403 Diagnostic Probes

## Setup
Set DEBUG_403=1 in environment before running these probes.

## A) Plain GET (should be 200 from your app)
```bash
curl -i http://localhost:5000/ -H 'Accept: application/json'
```

## B) API endpoint test (should be 200)
```bash
curl -i http://localhost:5000/api/chat/messages -H 'Accept: application/json'
```

## C) Debug endpoint test (should be 200 with x-app-layer header)
```bash
curl -i http://localhost:5000/__debug/ping -H 'Accept: application/json'
```

## D) POST request test (should be 201)
```bash
curl -i -X POST -H "Content-Type: application/json" \
  -d '{"content":"test message","isBot":false}' \
  http://localhost:5000/api/chat/messages
```

## E) Browser simulation (with cookies)
```bash
# First get cookies
curl -i -c cookies.txt http://localhost:5000/__debug/ping

# Then use cookies in subsequent requests
curl -i -b cookies.txt http://localhost:5000/api/chat/messages
```

## Expected Results:
- All requests should return 200/201 status codes
- Debug endpoints should include `x-app-layer: api` header
- No 403 errors should occur
- Server logs should show no 403 diagnostic entries

## If 403 occurs:
- Check if `x-app-layer` header is present (app vs edge)
- Check server logs for 403 diagnostic JSON
- Note the exact request that triggers 403
