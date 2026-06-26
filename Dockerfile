# Production Dockerfile for Continuum MVP.
# Node 22+: transitive deps (e.g. chevrotain via mermaid) declare engines.node >=22.
FROM node:22-slim AS build

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    # Give Node a larger heap so the Vite/Rollup build (mermaid + cytoscape +
    # recharts + katex in one graph) doesn't hit the default old-space limit and
    # get OOM-killed → retried. Raise if the build host has more RAM available.
    NODE_OPTIONS=--max-old-space-size=4096

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
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_CLERK_JWT_TEMPLATE
ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_ENVIRONMENT
ARG VITE_APP_VERSION
ARG VITE_MIGRATIONS_ENABLED
# Build-only Sentry CLI args for source map upload. SENTRY_AUTH_TOKEN must NOT
# be carried into the runtime container; the `runtime` stage below doesn't copy it.
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_AUTH_TOKEN
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_MCP_PUBLIC_URL=$VITE_MCP_PUBLIC_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_ENABLE_QUERY_DEVTOOLS=$VITE_ENABLE_QUERY_DEVTOOLS \
    VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY \
    VITE_CLERK_JWT_TEMPLATE=$VITE_CLERK_JWT_TEMPLATE \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_SENTRY_ENVIRONMENT=$VITE_SENTRY_ENVIRONMENT \
    VITE_APP_VERSION=$VITE_APP_VERSION \
    VITE_MIGRATIONS_ENABLED=$VITE_MIGRATIONS_ENABLED \
    SENTRY_ORG=$SENTRY_ORG \
    SENTRY_PROJECT=$SENTRY_PROJECT \
    SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

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
