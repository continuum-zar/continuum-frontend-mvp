# Dockerfile for Continuum MVP - builds from repo root
FROM node:20-slim

# Install build dependencies needed for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first to leverage cache
COPY package*.json ./

# Install all dependencies (including devDependencies for vite)
ENV NODE_ENV=development
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose the port Vite runs on
EXPOSE 5174

# Start the development server
CMD ["npm", "run", "dev", "--", "--host"]
