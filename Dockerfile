# Production Dockerfile for meawakemecode Email Worker Daemon
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and frontend dependency files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install root dependencies
RUN npm ci || npm install

# Install frontend dependencies
RUN cd frontend && (npm ci || npm install)

# Copy all source files
COPY . .

# Build root TypeScript into dist/
RUN npm run build

# Expose HTTP health check port
ENV PORT=8080
EXPOSE 8080

# Run email worker daemon with health check server
CMD ["node", "frontend/email-worker.mjs"]

