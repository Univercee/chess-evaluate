# Docker Deployment Guide

This guide explains how to build and run the Chess application using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+ (optional, for easier management)

## Quick Start with Docker Compose

The easiest way to run the application:

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at http://localhost:8080

## Building the Docker Image

### Using Docker directly

```bash
# Build the image
docker build -t chess-app:latest .

# Run the container
docker run -d -p 8080:80 --name chess-app chess-app:latest

# Stop the container
docker stop chess-app

# Remove the container
docker rm chess-app
```

### Using Docker Compose

```bash
# Build and start
docker-compose up -d --build

# Rebuild after code changes
docker-compose up -d --build

# Stop and remove
docker-compose down
```

## Configuration

### Environment Variables

The application supports the following environment variables:

- `NODE_ENV`: Application environment (default: production)

### Port Mapping

By default, the application is exposed on port 8080. To change the port:

**Docker:**
```bash
docker run -d -p 3000:80 --name chess-app chess-app:latest
```

**Docker Compose:**
Edit `docker-compose.yml`:
```yaml
ports:
  - "3000:80"
```

## Dockerfile Structure

The Dockerfile uses a multi-stage build:

1. **Builder Stage** (node:20-alpine):
   - Installs dependencies
   - Builds the application
   - Creates optimized production bundle

2. **Production Stage** (nginx:alpine):
   - Serves static files with nginx
   - Minimal image size (~25MB)
   - Optimized for production

## Nginx Configuration

The `nginx.conf` file includes:

- Gzip compression for faster loading
- Security headers (X-Frame-Options, XSS-Protection, etc.)
- Static asset caching (1 year for JS/CSS/images)
- SPA routing support (all routes redirect to index.html)
- Health check endpoint at `/health`

## Health Check

The container includes a health check endpoint:

```bash
curl http://localhost:8080/health
```

Response: `healthy`

Docker Compose automatically monitors health status every 30 seconds.

## Production Deployment

### Environment-specific builds

```bash
# Build for production
docker build -t chess-app:prod --build-arg NODE_ENV=production .

# Run with environment variable
docker run -d -p 8080:80 -e NODE_ENV=production chess-app:prod
```

### Using Docker Secrets (for sensitive data)

```bash
# Create secret
echo "my-secret-key" | docker secret create api_key -

# Use in docker-compose.yml
services:
  chess-app:
    secrets:
      - api_key
```

### Scaling with Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy service
docker stack deploy -c docker-compose.yml chess-stack

# Scale to 3 replicas
docker service scale chess-stack_chess-app=3
```

## Monitoring

### View container logs

```bash
# Docker
docker logs chess-app
docker logs -f chess-app  # Follow logs

# Docker Compose
docker-compose logs
docker-compose logs -f
```

### Container stats

```bash
docker stats chess-app
```

### Inspect container

```bash
docker inspect chess-app
```

## Updating the Application

### With Docker Compose

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build
```

### With Docker

```bash
# Pull latest changes
git pull

# Rebuild image
docker build -t chess-app:latest .

# Stop old container
docker stop chess-app
docker rm chess-app

# Start new container
docker run -d -p 8080:80 --name chess-app chess-app:latest
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs chess-app

# Check container status
docker ps -a

# Inspect container
docker inspect chess-app
```

### Build fails

```bash
# Clear Docker cache
docker builder prune

# Rebuild without cache
docker build --no-cache -t chess-app:latest .
```

### Port already in use

```bash
# Find process using port 8080
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Use different port
docker run -d -p 3000:80 --name chess-app chess-app:latest
```

### Health check failing

```bash
# Test health endpoint manually
curl http://localhost:8080/health

# Check nginx logs
docker exec chess-app cat /var/log/nginx/error.log
```

## Advanced Configuration

### Custom nginx configuration

Edit `nginx.conf` and rebuild:

```bash
docker-compose up -d --build
```

### Adding SSL/TLS

1. Obtain SSL certificate (Let's Encrypt, etc.)
2. Update `nginx.conf` with SSL configuration
3. Mount certificate directory:

```yaml
volumes:
  - ./ssl:/etc/nginx/ssl:ro
```

### Reverse proxy setup

For production, use a reverse proxy (nginx, Traefik, Caddy):

```yaml
# docker-compose.yml
services:
  reverse-proxy:
    image: traefik:v2.5
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  chess-app:
    build: .
    labels:
      - "traefik.http.routers.chess.rule=Host(`chess.example.com`)"
      - "traefik.http.routers.chess.entrypoints=websecure"
      - "traefik.http.routers.chess.tls=true"
```

## Image Optimization

The current image size is approximately 25MB. To further optimize:

1. Use `node:20-alpine` (already using)
2. Multi-stage build (already using)
3. Minimize dependencies in production
4. Use `.dockerignore` to exclude unnecessary files

## Security Best Practices

1. ✅ Use non-root user (nginx runs as non-root by default)
2. ✅ Keep base images updated
3. ✅ Scan images for vulnerabilities: `docker scan chess-app:latest`
4. ✅ Use specific image tags (not `latest` in production)
5. ✅ Enable security headers (already configured in nginx.conf)
6. ✅ Limit container resources:

```yaml
services:
  chess-app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t chess-app:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          docker login -u ${{ secrets.DOCKER_USER }} -p ${{ secrets.DOCKER_PASS }}
          docker tag chess-app:${{ github.sha }} myrepo/chess-app:latest
          docker push myrepo/chess-app:latest
```

### GitLab CI

```yaml
docker-build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t chess-app:$CI_COMMIT_SHA .
    - docker push chess-app:$CI_COMMIT_SHA
```

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
