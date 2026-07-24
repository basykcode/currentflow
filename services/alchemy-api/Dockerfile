# syntax=docker/dockerfile:1.7
FROM ghcr.io/astral-sh/uv:0.11.32 AS uv
FROM python:3.12.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

COPY --from=uv /uv /uvx /bin/
WORKDIR /app

COPY pyproject.toml uv.lock README.md ./
COPY src ./src
COPY migrations ./migrations
COPY data ./data
RUN uv sync --frozen --no-dev

RUN useradd --create-home --uid 10001 alchemy \
    && mkdir -p /app/.cache \
    && chown -R alchemy:alchemy /app/.cache
USER alchemy
ENV PATH="/app/.venv/bin:${PATH}"

EXPOSE 8000
CMD ["uvicorn", "current_alchemy.app:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
