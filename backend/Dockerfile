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

COPY --from=builder /backend/.venv /backend/.venv
COPY --from=builder /backend/app.py /backend/app.py
COPY --from=builder /backend/database.py /backend/database.py
COPY --from=builder /backend/domain /backend/domain
COPY --from=builder /backend/services /backend/services

ENV PATH="/backend/.venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]