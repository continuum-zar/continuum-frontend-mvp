# Production Dockerfile for Continuum MVP.
# Node 22+: transitive deps (e.g. chevrotain via mermaid) declare engines.node >=22.
FROM node:22-slim AS build

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

WORKDIR /app

# Layer cache: only invalidates when package manifests change.
COPY package*.json ./
RUN npm ci --include=dev --no-audit --no-fund

# Vite replaces `import.meta.env.VITE_*` at compile time. Values must exist in this stage —
# they are NOT read from the nginx runtime container. Railway: mark these variables as
# available at build time; Docker passes them when matching `ARG` names are declared.
ARG VITE_API_BASE_URL
ARG VITE_MCP_PUBLIC_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_ENABLE_QUERY_DEVTOOLS
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_MCP_PUBLIC_URL=$VITE_MCP_PUBLIC_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_ENABLE_QUERY_DEVTOOLS=$VITE_ENABLE_QUERY_DEVTOOLS

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

ENV PORT=8080

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Pre-compress immutable build assets. nginx serves these when clients accept gzip.
RUN find /usr/share/nginx/html/assets -type f \
    \( -name '*.js' -o -name '*.css' -o -name '*.svg' -o -name '*.json' \) \
    -exec gzip -k -9 {} \;

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
