#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/.."

echo "🚀 Iniciando Suite de Pruebas TIVIT..."
python3 test/run_tests.py "$@"
