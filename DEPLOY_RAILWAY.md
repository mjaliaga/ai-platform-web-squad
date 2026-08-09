# Despliegue en Railway

El proyecto se despliega como dos servicios independientes desde el mismo repositorio:

- `backend`: API Express + Prisma + SQLite persistente.
- `frontend`: React/Vite compilado y servido por Nginx.

## 1. Publicar el repositorio

Railway necesita acceder a un repositorio Git remoto. Sube este proyecto a GitHub/GitLab y confirma que existan estas carpetas:

```text
backend/
frontend/
docker-compose.yml
```

No subas ningún archivo `.env` ni contraseñas.

## 2. Crear el proyecto

1. En Railway selecciona `New Project`.
2. Selecciona `Deploy from GitHub Repo`.
3. Elige este repositorio.
4. Crea dos servicios usando el mismo repositorio.

## 3. Servicio Backend

Configura el `Root Directory` del servicio como:

```text
/backend
```

Railway detectará `backend/railway.toml` y `backend/Dockerfile`.

Variables de entorno:

```text
DATABASE_URL=file:/data/dev.db
JWT_SECRET=<secreto-largo-generado>
JWT_EXPIRES_IN=8h
COOKIE_SECURE=true
CORS_ORIGIN=https://<dominio-publico-del-frontend>
SEED_USERS=false
```

Agrega un volumen Railway montado exactamente en:

```text
/data
```

Sin este volumen, la base SQLite se perderá al recrear el servicio.

Después del primer deploy:

1. Genera un dominio público para el backend.
2. Comprueba `https://<backend>/api/health`.
3. La respuesta esperada es `{"ok":true}`.

### Usuario administrador inicial

Si necesitas crear el primer usuario del portal, configura temporalmente:

```text
SEED_USERS=true
SEED_ADMIN_NAME=Administrador TIVIT
SEED_ADMIN_EMAIL=admin@tu-dominio.com
SEED_ADMIN_PASSWORD=<contraseña-fuerte>
```

Despliega una vez, verifica el login y cambia después `SEED_USERS=false`. No uses las credenciales demo en producción.

## 4. Servicio Frontend

Configura el `Root Directory` del servicio como:

```text
/frontend
```

Railway usará `frontend/railway.toml` y `frontend/Dockerfile`.

Variable de entorno necesaria:

```text
BACKEND_URL=https://<dominio-publico-del-backend>
```

No es necesario configurar `PORT`: Railway lo inyecta automáticamente y `start.sh` lo utiliza para Nginx.

El frontend usa `/api` como URL del navegador. Nginx redirige internamente esas peticiones hacia `BACKEND_URL`.

Genera un dominio público para el frontend y abre:

```text
https://<dominio-publico-del-frontend>
```

## 5. Ajustar CORS

Vuelve al servicio backend y configura `CORS_ORIGIN` con el dominio exacto del frontend:

```text
CORS_ORIGIN=https://mi-frontend.up.railway.app
```

No agregues una barra `/` al final. Guarda y redeploya el backend.

## 6. Verificación final

Comprueba en este orden:

1. `https://<backend>/api/health` responde `200`.
2. `https://<frontend>/` carga la web.
3. `https://<frontend>/proyectos` carga los proyectos.
4. El frontend puede hacer login y consultar `/api/auth/me`.
5. La cookie `tivit_token` se crea correctamente bajo HTTPS.
6. Reinicia el backend y confirma que los usuarios y datos siguen presentes.

## 7. Dominios personalizados

Si posteriormente usas dominios propios, actualiza ambas variables:

- Backend: `CORS_ORIGIN=https://www.tu-dominio.com`.
- Frontend: `BACKEND_URL=https://api.tu-dominio.com`.

Después de cambiar cualquiera de las dos variables, redeploya el servicio correspondiente.

## Comandos de validación local

```bash
docker compose config
docker compose up --build -d
docker compose ps
docker compose logs -f backend
```
