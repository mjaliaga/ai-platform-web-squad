#!/bin/sh
set -e

echo "Running seed_content..."
if [ -d "$SEED_DATA_DIR" ]; then
  # NOTA: tivit-portal-backend ejecuta run_migrations al iniciar (src/main.rs:39 / src/db.rs:run_migrations).
  # Orden actual: seed -> exec backend, por lo que seed corre ANTES de migraciones.
  # Con `seed_content` sin --force (idempotente) es seguro: no pisa ediciones manuales.
  # --force solo opt-in via SEED_FORCE=true para resembrado completo.
  # `|| echo` preserva comportamiento con `set -e` (no aborta si seed falla/skipea).
  if [ "${SEED_FORCE:-false}" = "true" ]; then
    echo "Running seed_content --force (SEED_FORCE=true)..."
    seed_content --force || echo "seed_content failed"
  else
    echo "Running seed_content (without --force)..."
    seed_content || echo "seed_content skipped/failed"
  fi
else
  echo "Seed data dir not found, skipping seed."
fi

# Ejecutar el backend en foreground. tini (definido en el Dockerfile) se
# encarga de propagar SIGTERM al proceso, permitiendo un apagado limpio.
exec tivit-portal-backend
