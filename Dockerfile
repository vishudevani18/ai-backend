# =========================
# Builder stage
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Install dependencies
# Skip husky install by setting HUSKY=0 (bcryptjs is pure JS, no native build needed)
RUN HUSKY=0 npm ci

COPY . .

RUN npm run build

# =========================
# Production stage
# =========================
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Non-root user
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nestjs -u 1001

WORKDIR /app

# Copy package files first
COPY --from=builder /app/package*.json ./

# Install only production dependencies
# Skip scripts to avoid husky prepare script (bcryptjs is pure JS, no rebuild needed)
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy built app
COPY --from=builder /app/dist ./dist

# App directories
RUN mkdir -p uploads/images \
 && chown -R nestjs:nodejs /app

# Switch to non-root user after all installations
USER nestjs

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Optional: Cloud Run doesn't require this
# HEALTHCHECK CMD curl -f http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
