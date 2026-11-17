# =============================================================================
# ArivuPro Finance Career Portal — single-image deploy
# Node stage builds the Vite SPA (dist/); Python stage serves it via uvicorn.
# Mirrors nixpacks.toml: python311 + nodejs, npm run build, uvicorn main:app.
# =============================================================================

# ---- Stage 1: build the frontend ----
FROM node:20-slim AS frontend
WORKDIR /app

# VITE_* vars are inlined at build time — pass with --build-arg.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# --legacy-peer-deps: package.json pins esbuild@^0.25 but vite@8 peer-wants
# ^0.27/^0.28; modern npm's strict resolver rejects this, so use the lenient
# (pre-npm7) peer algorithm. Changes no dependency versions.
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# ---- Stage 2: Python runtime ----
FROM python:3.11-slim AS runtime
WORKDIR /app

COPY requirements.txt ./
RUN apt-get update && apt-get install -y --no-install-recommends libatomic1 && \
    rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir -r requirements.txt && \
    playwright install chromium --with-deps

# App code + the built SPA from stage 1
COPY . .
COPY --from=frontend /app/dist ./dist

# main.py reads PORT (defaults to 8000). Railway/Docker inject PORT at runtime.
EXPOSE 8000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
