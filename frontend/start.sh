#!/bin/sh
set -e

# Railway inyecta PORT; localmente (docker-compose) se usa 8080.
export PORT="${PORT:-8080}"
export BACKEND_URL="${BACKEND_URL:-http://backend:3000}"

# Validación básica de BACKEND_URL para evitar inyección en nginx.conf
case "$BACKEND_URL" in
  http://*|https://*)
    ;;
  *)
    echo "ERROR: BACKEND_URL debe empezar con http:// o https:// (valor: $BACKEND_URL)" >&2
    exit 1
    ;;
esac
if echo "$BACKEND_URL" | grep -q "[;'\"]"; then
  echo "ERROR: BACKEND_URL contiene caracteres no permitidos" >&2
  exit 1
fi

# Generar la configuración nginx desde el template.
envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Ejecutar nginx en foreground.
exec nginx -g 'daemon off;'
