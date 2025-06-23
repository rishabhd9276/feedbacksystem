# --- Build Stage ---
FROM python:3.10-slim as builder

WORKDIR /app

# Install all dependencies, including for testing
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY app ./app
COPY tests ./tests


# --- Test Stage ---
FROM builder as tester

WORKDIR /app

# Run the tests
CMD ["pytest"]


# --- Final Stage ---
FROM python:3.10-slim

WORKDIR /app

# Install only production dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code from the builder stage
COPY --from=builder /app/app ./app

# Create uploads directory and set permissions
RUN mkdir -p uploads && chmod 755 uploads

# Expose port
EXPOSE 8000

# Run the FastAPI app with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 