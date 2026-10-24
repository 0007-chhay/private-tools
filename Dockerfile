# Dockerfile for Wayback Machine Site Cloner
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* bun.lock* ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build Vite frontend and server
RUN npm run build

# Production image
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts

EXPOSE 3000

CMD ["node", "--experimental-strip-types", "server.ts"]
