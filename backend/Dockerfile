# Builder stage: build Python wheels once.
FROM python:3.12.2-slim AS builder

WORKDIR /backend

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /backend/wheels -r requirements.txt

# Runtime stage: install from prebuilt wheels and copy only app sources.
FROM python:3.12.2-slim

WORKDIR /backend

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1

COPY --from=builder /backend/wheels /wheels
COPY --from=builder /backend/requirements.txt .
RUN pip install --no-cache-dir /wheels/*

COPY app.py database.py ./
COPY domain ./domain
COPY services ./services

EXPOSE 80
CMD ["fastapi", "run", "app.py", "--host", "0.0.0.0", "--port", "80"]