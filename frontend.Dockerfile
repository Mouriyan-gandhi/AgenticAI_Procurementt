# ─────────────────────────────────────────────────────────
# Frontend Dockerfile — React + Vite (multi-stage build)
# ─────────────────────────────────────────────────────────

# ── Stage 1: Build ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy source and build
COPY frontend/ .
RUN npm run build

# ── Stage 2: Serve with Nginx ──────────────────────────
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
