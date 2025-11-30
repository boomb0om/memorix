# Memorix

Веб-приложение для управления заметками и курсами с поддержкой генерации контента через LLM.

## Структура проекта

Проект состоит из двух основных частей:

- **backend/** — FastAPI приложение с REST API
  - `core/` — базовая функциональность (аутентификация, конфигурация, LLM интеграция, вызов моделей)
  - `courses/` — управление курсами и уроками
  - `users/` — управление пользователями
  - `notes/` — управление заметками
  - `migrations/` — миграции базы данных (Alembic)

- **frontend/** — React приложение
  - `src/components/` — React компоненты
  - `src/contexts/` — контексты для управления состоянием
  - `src/services/` — API клиент

- **docker-compose.yml** — конфигурация для запуска всех сервисов

## Запуск проекта

### Требования
- Docker и Docker Compose
- Переменная окружения `MISTRAL_API_KEY` (для работы LLM)

### Запуск

1. Создайте файл `.env` в корне проекта (если его нет) и добавьте:
   ```
   MISTRAL_API_KEY=your_api_key_here
   ```

2. Запустите все сервисы через Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. После запуска приложение будет доступно:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - PostgreSQL: localhost:5432

4. Зайдите на фронтенд (http://localhost:3000) и создайте аккаунт, если его еще нет

### Остановка

```bash
docker-compose down
```

Для полной очистки (включая данные БД):
```bash
docker-compose down -v
```

