FROM python:3.11-slim

# Install system dependencies
# libmagic1 for python-magic
# tesseract-ocr for OCR
# poppler-utils for pdf2image
# libpq-dev for psycopg2
# libqpdf-dev for pikepdf
# g++ and gcc for building extensions
RUN apt-get update && apt-get install -y \
    libmagic1 \
    tesseract-ocr \
    poppler-utils \
    libpq-dev \
    libqpdf-dev \
    pkg-config \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# CRITICAL: python-magic-bin is Windows-only. 
# We swap it for python-magic (without version constraint to avoid mismatches) 
# which works on Linux with libmagic1.
RUN sed -i 's/python-magic-bin==.*/python-magic/g' requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create data directory for uploads
RUN mkdir -p data/uploads

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 8000

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
