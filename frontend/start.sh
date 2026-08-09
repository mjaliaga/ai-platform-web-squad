#!/bin/sh
set -e

# Railway inyecta PORT; localmente (docker-compose) se usa 8080.
export PORT="${PORT:-8080}"
export BACKEND_URL="${BACKEND_URL:-http://backend:3000}"

envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
