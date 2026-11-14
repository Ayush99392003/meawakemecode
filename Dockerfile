# Production Dockerfile for meawakemecode Email Worker Daemon
FROM node:20-alpine

WORKDIR /app

# Copy root dependency files
COPY package*.json ./

# Install root backend dependencies
RUN npm install

# Copy backend TypeScript sources, configs, and scripts
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
COPY data ./data

# Build TypeScript to dist/
RUN npm run build

# Expose HTTP health check port
ENV PORT=8080
EXPOSE 8080

# Run email worker daemon with health check server
CMD ["node", "scripts/email-worker.mjs"]
