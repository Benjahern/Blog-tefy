# Tefy Literary Journal

Frontend React/Vite, backend Go y MongoDB. Traefik lo administra Coolify fuera de este repositorio.

## Desarrollo local

Copiar `.env.example` a `.env` y ejecutar `docker compose up --build`. Frontend:
`http://localhost:8443`; API: `http://localhost:8080`; Mongo replica set:
`localhost:27017`. MongoDB persiste en un volumen Docker. El usuario inicial se
configura mediante `BOOTSTRAP_ADMIN_USERNAME` y `BOOTSTRAP_ADMIN_PASSWORD`;
reemplazar las credenciales de ejemplo.

## Producción

Configurar en Coolify los secretos `IMAGE_NAMESPACE`, `IMAGE_TAG`,
`MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD`, `MONGODB_URI`,
`BOOTSTRAP_ADMIN_USERNAME` y `BOOTSTRAP_ADMIN_PASSWORD`; ejecutar
`docker compose -f compose.production.yaml up -d`. MongoDB no publica puertos.
Enrutar el frontend y `/api/v1` al backend usando la configuración Traefik ya
existente. No se instala otro proxy.

Las imágenes de producción se publican para `linux/amd64` y `linux/arm64` en
Docker Hub (`bigbenj4/appblog`) al integrar a `main`, solo si pasan los checks.
Configurar `DOCKERHUB_USERNAME` y `DOCKERHUB_TOKEN` como secretos de GitHub. La
workflow manual **Promote develop to main** abre el PR de promoción; no lo
integra automáticamente. Activar protección de `main` y checks obligatorios.

Desarrollo: ramas `feature/*` creadas desde `develop` y PR a `develop`; luego
promoción revisada desde `develop` a `main`. La infraestructura de despliegue
no hace cambios directos a esas ramas.
