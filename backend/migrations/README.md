# Migrations

# Создать миграцию

```bash
docker compose up db
```

```bash
alembic upgrade head
```

```bash
alembic revision --autogenerate -m "message"
```