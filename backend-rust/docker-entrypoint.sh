#!/bin/sh
set -e

echo "Running seed_content..."
if [ -d "$SEED_DATA_DIR" ]; then
  seed_content --force || echo "Seed failed or already applied, continuing..."
else
  echo "Seed data dir not found, skipping seed."
fi

# Ejecutar el backend en foreground. tini (definido en el Dockerfile) se
# encarga de propagar SIGTERM al proceso, permitiendo un apagado limpio.
exec tivit-portal-backend
