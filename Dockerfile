# ── Stage 1: Builder ──────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY web-app/package.json web-app/package-lock.json* ./web-app/
COPY wa-service/package.json wa-service/package-lock.json* ./wa-service/

# Dummy ENV
ENV GOOGLE_API_KEY="dummy"
ENV GEMINI_API_KEY="dummy"

# Install dependencies
RUN cd web-app && npm install --legacy-peer-deps && cd ../wa-service && npm install

COPY web-app/ ./web-app/
COPY wa-service/ ./wa-service/
COPY ecosystem.config.js ./

# Build Next.js
RUN cd web-app && npm run build

# ── Stage 2: Production Runner (CLEAN & FAST) ─────────────
FROM node:20-slim AS runner

# Tuh kan, gak perlu apt-get install chromium lagi! 🎉
WORKDIR /app

RUN npm install -g pm2

# Copy files
COPY ecosystem.config.js ./
COPY --from=builder /app/web-app/.next/standalone ./web-app-standalone/
COPY --from=builder /app/web-app/.next/static ./web-app-standalone/web-app/.next/static
COPY --from=builder /app/web-app/public ./web-app-standalone/web-app/public
COPY --from=builder /app/wa-service ./wa-service/

# Permissions
RUN chown -R node:node /app
USER node

ENV PORT=7860
ENV NODE_ENV=production
EXPOSE 7860

CMD ["pm2-runtime", "start", "ecosystem.config.js"]    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy PM2 config
COPY ecosystem.config.js ./

# ── Copy Next.js standalone build ──
COPY --from=builder /app/web-app/.next/standalone ./web-app-standalone/
COPY --from=builder /app/web-app/.next/static ./web-app-standalone/web-app/.next/static
COPY --from=builder /app/web-app/public ./web-app-standalone/web-app/public

# ── Copy WA Service ──
COPY --from=builder /app/wa-service ./wa-service/

# Create non-root user (Hugging Face requirement)
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# Hugging Face Spaces exposes port 7860
ENV PORT=7860
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

EXPOSE 7860

# Start both services via PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
