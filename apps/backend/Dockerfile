# Backend Dockerfile - Development
# Node.js + Express + TypeScript with hot reload

FROM node:20-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY apps/backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/backend/src ./src
COPY apps/backend/tsconfig.json ./
COPY apps/backend/drizzle.config.ts ./

# Copy environment file if exists
COPY apps/backend/.env* ./

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || true

# Start development server with hot reload
CMD ["npm", "run", "dev"]
