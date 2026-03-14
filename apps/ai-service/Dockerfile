# AI Service Dockerfile - Development
# Python + FastAPI with hot reload

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY apps/ai-service/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY apps/ai-service/ ./

# Create directories if needed
RUN mkdir -p /app/logs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/docs')" || exit 1

# Set environment variable to ensure Python output is unbuffered
ENV PYTHONUNBUFFERED=1

# Start development server with hot reload
# --host 0.0.0.0 to expose to Docker network
# --reload for auto-reload on code changes
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
