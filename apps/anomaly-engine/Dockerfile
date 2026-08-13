FROM python:3.11-slim

WORKDIR /app

COPY apps/anomaly-engine/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/anomaly-engine/engine/ ./engine/
COPY packages/ ./packages/

# Set PYTHONPATH so python can find packages/shared
ENV PYTHONPATH=/app

CMD ["python", "-m", "engine.main"]