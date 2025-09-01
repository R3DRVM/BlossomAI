# Environment Setup Guide

This guide covers environment configuration for different deployment scenarios.

## Local Development

Create a `.env` file in the project root:

```bash
# Chat demo
DEMO_AI=1
AI_STREAM=1
DEMO_PERSIST_SERVER=0

# Data providers (live + mock fallback)
LIVE_PRICES=1
LIVE_YIELDS=1
LIVE_TVL=1
LIVE_RISK=0

# API base (front-end -> your server)
VITE_API_BASE=http://localhost:5000

# CORS (allow your Vite origin)
ALLOWED_ORIGINS=http://localhost:5173
# Optional: if you use Vite proxy and same-origin, CORS may be bypassed in dev.
```

**Key Points:**
- `ALLOWED_ORIGINS` should match your Vite dev server origin
- `VITE_API_BASE` points to your Express server
- All live data providers enabled by default
- Demo AI enabled for development

## Vercel Preview Deployment

Set these environment variables in your Vercel project settings:

```bash
DEMO_AI=1
AI_STREAM=1
DEMO_PERSIST_SERVER=0

LIVE_PRICES=1
LIVE_YIELDS=1
LIVE_TVL=1
LIVE_RISK=0

# CORS: exact origins + preview regex
ALLOWED_ORIGINS=https://your-canonical-domain.com
ALLOWED_ORIGIN_REGEX_PREVIEW=^https:\/\/.*\.vercel\.app$

# If the API is a separate deployment:
VITE_API_BASE=https://<your-api>.vercel.app
```

**Key Points:**
- `ALLOWED_ORIGIN_REGEX_PREVIEW` allows all Vercel preview URLs
- `ALLOWED_ORIGINS` should include your production domain
- `VERCEL_ENV=preview` is automatically set by Vercel

## Vercel Production Deployment

Set these environment variables in your Vercel project settings:

```bash
DEMO_AI=1
AI_STREAM=1
DEMO_PERSIST_SERVER=0

LIVE_PRICES=1
LIVE_YIELDS=1
LIVE_TVL=1
LIVE_RISK=0

ALLOWED_ORIGINS=https://your-canonical-domain.com,https://app.yourdomain.com
# No preview regex in prod
# If API separate:
VITE_API_BASE=https://api.yourdomain.com
```

**Key Points:**
- `ALLOWED_ORIGINS` should include all your production domains
- No preview regex needed in production
- `VERCEL_ENV=production` is automatically set by Vercel

## Environment Variable Reference

### Required for Production

| Variable | Description | Example |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins | `https://yourdomain.com` |
| `ALLOWED_ORIGIN_REGEX_PREVIEW` | Regex for Vercel preview URLs | `^https:\/\/.*\.vercel\.app$` |

### Optional (with defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `DEMO_AI` | `1` (dev), `0` (prod) | Enable AI chat functionality |
| `AI_STREAM` | `1` (dev), `0` (prod) | Enable streaming responses |
| `LIVE_PRICES` | `1` | Enable live price data |
| `LIVE_YIELDS` | `1` | Enable live yield data |
| `LIVE_TVL` | `1` | Enable live TVL data |
| `LIVE_RISK` | `0` | Enable live risk scoring |
| `PORT` | `5000` | Server port |
| `VITE_API_BASE` | `same-origin` | Frontend API base URL |

### Auto-set by Platform

| Variable | Set By | Value |
|----------|--------|-------|
| `NODE_ENV` | Vercel/Node | `development`/`production` |
| `VERCEL_ENV` | Vercel | `preview`/`production` |

## Validation

The server validates environment configuration on startup:

1. **CORS Configuration**: Ensures `ALLOWED_ORIGINS` or `ALLOWED_ORIGIN_REGEX_PREVIEW` is set in production
2. **Preview Mode**: Warns if `VERCEL_ENV=preview` but no preview regex is set
3. **Defaults**: Applies safe defaults for missing optional variables

## Troubleshooting

### CORS Errors
- Ensure `ALLOWED_ORIGINS` includes your frontend URL
- Check that `VITE_API_BASE` points to the correct API server
- Verify `ALLOWED_ORIGIN_REGEX_PREVIEW` is set for Vercel preview deployments

### Environment Validation Failures
- Check server logs for specific validation errors
- Ensure all required variables are set for your deployment mode
- Verify variable names and values match the expected format

### Live Data Issues
- Check that `LIVE_*` flags are set correctly
- Verify external API endpoints are accessible
- Monitor server logs for provider fallback messages

