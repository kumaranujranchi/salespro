# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install clean dependencies
RUN npm ci

# Copy source files
COPY . .

# Accept build arguments for environment variables
ARG VITE_CONVEX_URL
ARG VITE_CONVEX_SITE_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_CONVEX_URL=${VITE_CONVEX_URL:-https://proper-peccary-781.convex.cloud}
ENV VITE_CONVEX_SITE_URL=${VITE_CONVEX_SITE_URL:-https://proper-peccary-781.convex.site}

# Build production bundle
RUN npm run build

# Production Stage: Serve with Nginx Alpine
FROM nginx:alpine

# Copy custom nginx configuration with SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
