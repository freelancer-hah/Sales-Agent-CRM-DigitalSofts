# Backend Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json tsconfig.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy backend source
COPY src ./src

# Build TypeScript to dist
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

EXPOSE 5003

CMD ["node", "dist/server.js"]
