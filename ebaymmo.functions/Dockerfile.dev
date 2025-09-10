# Base stage for shared configurations
FROM node:23.6.0 AS base
WORKDIR /app
COPY package*.json ./

# Development stage
FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production runtime stage
FROM node:23.6.0 AS production-runtime
WORKDIR /app
COPY --from=production /app/dist ./dist
COPY --from=production /app/package*.json ./
RUN npm ci --only=production
CMD ["npm", "run", "start"]