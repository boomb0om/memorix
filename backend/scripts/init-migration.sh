#!/bin/bash

# Set default values
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-auth_user}
DB_NAME=${DB_NAME:-auth_db}

echo "Starting migration init container..."
echo "Database host: $DB_HOST"
echo "Database port: $DB_PORT"
echo "Database user: $DB_USER"
echo "Database name: $DB_NAME"

echo "Database is ready - running migrations"

# Set environment variables for alembic
export DATABASE_URI="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

# Run migrations
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "Migrations completed successfully"
    exit 0
else
    echo "Migrations failed"
    exit 1
fi
