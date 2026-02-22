# ─────────────────────────────────────────────────────────
# Backend Dockerfile — FastAPI + AI Agent Pipeline
# ─────────────────────────────────────────────────────────
FROM python:3.11-slim

# System deps for PDF processing (PyMuPDF) and general utils
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY api.py .
COPY main.py .
COPY agents/ ./agents/
COPY tools/ ./tools/
COPY templates/ ./templates/
COPY static/ ./static/
COPY memory/ ./memory/

# Copy data files (requirements PDF & vendor proposals)
COPY Company_Requirements.pdf .
COPY Company_Knowledge_Base.pdf .
COPY vendor_proposals/ ./vendor_proposals/

# Copy .env for API keys
COPY .env .

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
