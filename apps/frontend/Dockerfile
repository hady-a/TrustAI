# Frontend Dockerfile - Development
# React + Vite with hot reload

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY apps/frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/frontend/src ./src
COPY apps/frontend/public ./public
COPY apps/frontend/index.html ./
COPY apps/frontend/vite.config.ts ./
COPY apps/frontend/tsconfig*.json ./
COPY apps/frontend/tailwind.config.js ./
COPY apps/frontend/postcss.config.js ./

# Copy environment file if exists
COPY apps/frontend/.env* ./

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5173/ || exit 1

# Start development server with hot reload
# Host must be 0.0.0.0 for Docker to expose properly
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
