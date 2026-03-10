#!/bin/bash

# Navigate to the project root
cd "$(dirname "$0")"

echo "🧹 Cleaning Continuum MVP containers..."
docker compose down

echo "✅ Containers stopped and removed."
