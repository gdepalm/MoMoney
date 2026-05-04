FROM ghcr.io/astral-sh/uv:python3.12-alpine AS builder

WORKDIR /backend

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

COPY . .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev


FROM python:3.12-alpine

WORKDIR /backend

COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/app.py /app/app.py
COPY --from=builder /app/database.py /app/database.py
COPY --from=builder /app/domain /app/domain
COPY --from=builder /app/services /app/services

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]