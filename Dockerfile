# Multi-stage build for React + Vite application

# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Public site address for canonical/og:url/hreflang and sitemap.xml (optional). docker-compose
# passes it from .env; with plain docker: docker build --build-arg SITE_URL=https://chess.example.com .
# (.env is excluded from the build context by .dockerignore, so it arrives as a build arg)
ARG SITE_URL=""
ENV SITE_URL=$SITE_URL

# Build the application
RUN npm run build

# Stage 2: Production image with nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
