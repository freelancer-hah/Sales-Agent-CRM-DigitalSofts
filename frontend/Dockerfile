# Frontend Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./
RUN npm ci

# Copy frontend source
COPY . .

# Build production bundle
RUN npm run build

# Nginx production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx SPA & Proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
