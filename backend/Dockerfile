# ---------- HustleHub+ API image ----------
# Stage 1: install production dependencies only.
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Stage 2: small runtime image.
FROM node:20-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app

# openssl is only used to create the self-signed TLS certificate for the HTTPS API.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

# Self-signed certificate (the API only serves HTTPS). Replace with a real
# certificate / mount your own into /app/certs for a real deployment.
RUN mkdir -p certs logs \
    && openssl req -nodes -new -x509 -keyout certs/key.pem -out certs/cert.pem \
       -days 365 -subj "/CN=localhost" \
    && chown -R node:node /app/certs /app/logs

# Run as the unprivileged "node" user (never as root).
USER node
EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "require('https').get('https://localhost:5000/api/health',{rejectUnauthorized:false},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "src/server.js"]
