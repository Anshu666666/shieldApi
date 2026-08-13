FROM python:3.11-slim

WORKDIR /app

COPY apps/gateway/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/gateway/app/ ./app/
COPY packages/ ./packages/

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
