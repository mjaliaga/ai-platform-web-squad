# Backup y Restore — tivit-db (SQLite)

Guía operativa para respaldar y restaurar el volumen `tivit-db` que persiste `/app/data/portal.db` del backend.

> **Volumen:** `tivit-db` (declarado en `docker-compose.yml`).
> **Ruta dentro del contenedor:** `/app/data/portal.db`.
> Destruir el volumen borra la BD de forma irreversible.

---

## 1. Backup completo del volumen (recomendado)

Crea un tarball del volumen sin detener el stack (copia consistente si no hay writes concurrentes; para consistencia total, pausar writes o stop backend).

```bash
docker run --rm -v tivit-db:/data -v $(pwd):/backup alpine tar czf /backup/tivit-db-$(date +%F).tgz /data
ls -lh tivit-db-*.tgz
```

**Restore desde tarball:**

```bash
# Crea el volumen si no existe
docker volume create tivit-db
docker run --rm -v tivit-db:/data -v $(pwd):/backup alpine sh -c "rm -rf /data/* && tar xzf /backup/tivit-db-YYYY-MM-DD.tgz -C / --strip-components=1"
# Alternativa con strip 1 si el tar se creó con /data absoluto:
# tar xzf /backup/tivit-db-YYYY-MM-DD.tgz -C /
docker compose up -d backend
```

---

## 2. Alternativa: dump SQL con sqlite3

Útil para inspección, diff o migración entre versiones. Ejecutar dentro del contenedor:

```bash
docker compose exec backend sqlite3 /app/data/portal.db .dump > backup.sql
# Restore:
cat backup.sql | docker compose exec -T backend sqlite3 /app/data/portal.db
# O desde host si tenés sqlite3 local y copia del volumen:
# sqlite3 /app/data/portal.db .dump > backup.sql
```

Notas:
- `.dump` genera SQL plano (schema + datos). Restaurar recrea el estado exacto.
- Verificar con `sqlite3 /app/data/portal.db "PRAGMA integrity_check;"` antes y después.

---

## 3. Opción continua: litestream

Para replicación continua y point-in-time recovery, usar `litestream`:

- Replica WAL de SQLite a S3/GCS/SFTP en tiempo real.
- Docs: https://litestream.io
- Ejemplo mínimo (dentro del servicio backend o sidecar):
  ```yaml
  # litestream.yml
  dbs:
    - path: /app/data/portal.db
      replicas:
        - type: s3
          bucket: tivit-backups
          path: portal.db
  ```
- Ejecutar: `litestream replicate -config /etc/litestream.yml`
- Restore: `litestream restore -o /app/data/portal.db s3://tivit-backups/portal.db`

`litestream` es recomendado en producción si se necesita RPO bajo sin backups manuales.

---

## 4. Advertencia: `docker compose down -v` destruye volumen

```bash
docker compose down      # OK: detiene contenedores, conserva volúmenes
docker compose down -v   # PELIGRO: borra volúmenes tivit-db y tivit-media — BD irrecuperable sin backup
```

**Regla:** nunca usar `-v` en producción sin backup previo verificado. Alias seguro:

```bash
alias dcdown='docker compose down'  # sin -v
```

---

## 5. Seed y `SEED_FORCE=true` (solo opt-in)

El entrypoint del backend ejecuta `seed_content` al arrancar:

- Sin `SEED_FORCE`: inserta solo items faltantes (por `collection + slug`), no sobrescribe.
- Con `SEED_FORCE=true`: sobrescribe items existentes con `frontend/src/data/*`.

```bash
# Solo cuando querés forzar re-seed desde estáticos:
SEED_FORCE=true docker compose up -d backend
docker compose exec backend seed_content --force  # alternativa manual
```

`SEED_FORCE=true` es **solo opt-in**. No usar por defecto: pisaría ediciones hechas desde `/portal/cms` en `content_items`.

---

## 6. Cron sugerido (host)

```bash
# crontab -e — backup diario 03:00, retención 7 días
0 3 * * * docker run --rm -v tivit-db:/data -v /opt/backups:/backup alpine tar czf /backup/tivit-db-$(date +\%F).tgz /data && find /opt/backups -name "tivit-db-*.tgz" -mtime +7 -delete
```

Verificar restores periódicamente.

## Archivos clave

| Archivo | Rol |
|---|---|
| `backend-rust/src/bin/seed_content.rs` | Seed JSON → BD |
| `backend-rust/docker-entrypoint.sh` | Orquesta migración + seed al arrancar |
| `docker-compose.yml` | Define volumen `tivit-db` |
