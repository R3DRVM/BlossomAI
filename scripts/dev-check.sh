#!/bin/bash

echo "🔍 BlossomAI Development Environment Check"
echo "=========================================="

# Check if server is running
echo "📡 Checking server status..."
if curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo "✅ Server is running on port 5000"
else
    echo "❌ Server is not responding on port 5000"
    echo "   Try running: npm run dev"
    exit 1
fi

# Check API endpoints
echo "🔌 Checking API endpoints..."
if curl -s http://localhost:5000/api/chat/messages > /dev/null 2>&1; then
    echo "✅ API endpoints are working"
else
    echo "❌ API endpoints are not responding"
fi

# Check if Vite is serving frontend
echo "🌐 Checking frontend..."
if curl -s http://localhost:5000 | grep -q "vite" > /dev/null 2>&1; then
    echo "✅ Frontend is being served by Vite"
else
    echo "❌ Frontend is not being served properly"
fi

# Check for common port conflicts
echo "🔒 Checking for port conflicts..."
if lsof -i :5000 > /dev/null 2>&1; then
    echo "✅ Port 5000 is available and in use by our server"
else
    echo "❌ Port 5000 is not in use"
fi

echo ""
echo "🎯 If everything shows ✅, your development environment is ready!"
echo "🌐 Open http://localhost:5000 in your browser"
echo ""
echo "🔄 To restart the server: pkill -f 'tsx server/index.ts' && npm run dev"
