# Dockerfile for Continuum MVP - builds from repo root
FROM node:20-slim

# Avoid noisy / flaky npm behaviors during install (helps in CI and with npm 10.x quirks).
ENV NODE_ENV=development \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

# No apt install: Vite + Tailwind use prebuilt binaries (esbuild, @tailwindcss/oxide).
# If a future dependency needs node-gyp, add build tools back with HTTPS mirrors, e.g.:
#   RUN sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources \
#     && apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
#     && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Layer cache: only invalidates when package manifests change
COPY package*.json ./

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# App source (bind-mount overwrites this at runtime in docker-compose; image still needs files for non-mounted runs)
COPY . .

# Do NOT run npm ci here: npm 10.x can exit with "Exit handler never called" during image build
# while still failing the RUN step. Dependencies are installed in docker-entrypoint.sh when
# the container starts (see /app/node_modules volume in docker-compose).

EXPOSE 5174

ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["npm", "run", "dev", "--", "--host"]
