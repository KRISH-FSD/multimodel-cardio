# ── Stage 1: Build Frontend (Vite + React 19 + Three.js) ─────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/web

# Install build dependencies
COPY web/package.json ./
RUN npm install

# Copy web source code and compile production assets
COPY web/ ./
RUN npm run build

# ── Stage 2: Production Python Runtime (FastAPI + ML Ensembles) ──────
FROM python:3.10-slim AS runtime
WORKDIR /app

# Ensure Python doesn't buffer outputs or write pyc
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install runtime dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application directories
COPY api/ ./api/
COPY src/ ./src/
COPY data/ ./data/
COPY artifacts/ ./artifacts/

# Copy compiled frontend from Stage 1 into web/dist
COPY --from=frontend-builder /app/web/dist ./web/dist

# Expose HTTP port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# Launch ASGI production server
CMD ["uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8000"]
