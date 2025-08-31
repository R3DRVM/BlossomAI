# 403 Error Root Cause Analysis

## Problem
The application was experiencing HTTP 403 "Access Denied" errors, particularly in browser environments.

## Root Cause
The 403 errors were caused by a **CORS misconfiguration** where:
- Client-side code was using `credentials: "include"` in fetch requests
- Server-side CORS was set to `Access-Control-Allow-Origin: '*'`
- **Browser security policy** blocks requests with credentials when CORS origin is wildcard (`*`)

## The Fix
**Applied minimal CORS fix** in `server/index.ts`:

```javascript
// Before (causing 403s)
res.header('Access-Control-Allow-Origin', '*');

// After (working correctly)
const origin = req.headers.origin;
if (origin) {
  res.header('Access-Control-Allow-Origin', origin);
} else {
  res.header('Access-Control-Allow-Origin', '*');
}
res.header('Access-Control-Allow-Credentials', 'true');
```

## Key Changes
1. **Origin reflection**: Use the actual request origin instead of wildcard
2. **Credentials support**: Added `Access-Control-Allow-Credentials: true`
3. **Fallback**: Keep wildcard for requests without origin header

## Detection
To detect regressions:
- Check browser console for CORS errors
- Verify `Access-Control-Allow-Credentials: true` header is present
- Ensure `Access-Control-Allow-Origin` matches the actual request origin
- Test with `credentials: "include"` in fetch requests

## Files Modified
- `server/index.ts`: CORS middleware configuration
- `server/routes.ts`: Added debug endpoints for diagnostics
- `scripts/403-probes.md`: Diagnostic test procedures

## Testing
All API endpoints now work correctly:
- ✅ `GET /api/chat/messages` - 200 OK
- ✅ `POST /api/chat/messages` - 201 Created  
- ✅ `GET /api/auth/user` - 200 OK
- ✅ Debug endpoints with `x-app-layer: api` header

## Prevention
- Never use `Access-Control-Allow-Origin: '*'` with `credentials: "include"`
- Always test CORS configuration in browser environment
- Use origin reflection for credentials support
- Monitor browser console for CORS-related errors
