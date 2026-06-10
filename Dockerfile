# ============================================
# Polla Mundialista — Multi-stage Dockerfile
# Cloud Run optimizado
# ============================================

# Stage 1: Build frontend
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

# Copiar backend compilado y dependencias de producción
COPY server/package*.json ./
RUN npm ci --omit=dev

COPY --from=server-build /app/server/dist ./dist
COPY --from=client-build /app/client/dist ./client-dist

# Cloud Run asigna PORT automáticamente
EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "dist/index.js"]
