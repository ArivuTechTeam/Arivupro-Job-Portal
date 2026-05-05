FROM python:3.11-slim

WORKDIR /app

# System dependencies (tesseract + poppler for PDF processing)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies from flat requirements.txt
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .

# Expose port (Railway injects $PORT at runtime)
EXPOSE 8080

# Migrate + collectstatic + start gunicorn
CMD sh -c "python manage.py migrate --no-input && python manage.py collectstatic --no-input && gunicorn wsgi:application --bind 0.0.0.0:${PORT:-8080} --workers 2 --timeout 120"
