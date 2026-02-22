#!/bin/bash

# Navigate to the project root
cd "$(dirname "$0")"

echo "🚀 Starting Continuum MVP..."
docker compose up -d --build frontend

echo "✅ Frontend container started at http://localhost:5174"
echo "📡 Connecting to Backend at http://localhost:8001/api"
echo ""
echo "Following logs (Ctrl+C to exit logs)..."
docker compose logs -f frontend
