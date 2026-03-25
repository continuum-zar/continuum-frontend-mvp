#!/bin/sh
set -e

# Bind-mount `.:/app` replaces the image filesystem; the named anonymous volume at
# `/app/node_modules` starts empty and hides deps from the image build. Install when missing
# or broken (e.g. empty `node_modules/vite` after a failed/partial install).
if [ ! -f node_modules/vite/package.json ]; then
  echo "docker-entrypoint: installing dependencies (node_modules missing or incomplete)..."
  # npm ci can hit "Exit handler never called" (npm bug); fall back to npm install.
  npm ci --no-audit --no-fund || npm install --no-audit --no-fund
fi

exec "$@"
