FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libcairo2 \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libgdk-pixbuf-xlib-2.0-0 \
    libffi-dev \
    shared-mime-info \
 && rm -rf /var/lib/apt/lists/*

# Установка uv
RUN pip install --no-cache-dir -U uv

# Копируем файлы зависимостей
COPY pyproject.toml uv.lock ./

# Устанавливаем зависимости в system Python (без venv)
# Это быстрее и эффективнее для Docker контейнеров
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --all-groups

# Копируем весь код
COPY . .

EXPOSE 8000

# Запускаем напрямую через uv run без пересоздания окружения
CMD ["uv", "run", "--no-sync", "__main__:app", "--host", "0.0.0.0", "--port", "8000"]
