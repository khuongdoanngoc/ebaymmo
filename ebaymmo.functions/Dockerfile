# =========================
# STAGE 1: Build NestJS app
# =========================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the app (compile TypeScript -> JavaScript)
RUN npm run build

# =========================
# STAGE 2: Run NestJS app
# =========================
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Only copy necessary files from build stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/sdk ./src/sdk

# Expose port (default NestJS port)
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
