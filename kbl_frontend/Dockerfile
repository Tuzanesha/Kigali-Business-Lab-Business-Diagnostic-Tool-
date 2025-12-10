# Multi-stage Dockerfile for Next.js frontend
# Works for both development and production

# =====================
# Development stage
# =====================
FROM node:18-alpine AS development

WORKDIR /app

# Accept build args for environment variables
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_ENV=development

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Pre-create files that Next.js needs to write to
RUN touch next-env.d.ts && chmod 666 next-env.d.ts

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

# =====================
# Build stage for production
# =====================
FROM node:18-alpine AS builder

WORKDIR /app

# Accept build args for environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build for production
RUN npm run build

# =====================
# Production stage
# =====================
FROM node:18-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]

