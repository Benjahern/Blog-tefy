# Tefy Literary Journal

Frontend React/Vite, backend Go y MongoDB.

## Desarrollo local

Copiar `.env.example` a `.env` y ejecutar `docker compose up --build`. Frontend:
`http://localhost:8443`; API: `http://localhost:8080`; Mongo replica set:
`localhost:27017`. MongoDB persiste en un volumen Docker. El usuario inicial se
configura mediante `BOOTSTRAP_ADMIN_USERNAME` y `BOOTSTRAP_ADMIN_PASSWORD`;
reemplazar las credenciales de ejemplo.

## Producción

Crear `.env` a partir de `.env.example`, cambiar credenciales y configurar
`IMAGE_REPOSITORY`, `IMAGE_TAG`, `SITE_URL`, `MONGODB_URI`,
`BOOTSTRAP_ADMIN_USERNAME` y `BOOTSTRAP_ADMIN_PASSWORD`. El frontend recibe
`API_UPSTREAM` (por defecto `http://backend:8080`) y hace proxy interno de
`/api/v1/` y `/robots.txt` al backend. El dominio/proxy externo solo debe enviar
el tráfico HTTPS del sitio al puerto local `PROD_FRONTEND_PORT` (por defecto
`8092`); no publicar el backend ni MongoDB. `PROD_BACKEND_PORT` (por defecto
`8091`) solo queda enlazado a localhost para diagnóstico. Arranque/actualización:

```sh
docker compose -f compose.production.yaml pull
docker compose -f compose.production.yaml up -d
```

Las imágenes de producción se publican para `linux/amd64` y `linux/arm64` en
Docker Hub (`bigbenj4/appblog`) al integrar a `main`, solo si pasan los checks;
Compose consume las etiquetas `frontend-latest` y `backend-latest`.
Configurar `DOCKERHUB_USERNAME` y `DOCKERHUB_TOKEN` como secretos de GitHub. La
workflow manual **Promote develop to main** abre el PR de promoción; no lo
integra automáticamente. Activar protección de `main` y checks obligatorios.

Desarrollo: ramas `feature/*` creadas desde `develop` y PR a `develop`; luego
promoción revisada desde `develop` a `main`. La infraestructura de despliegue
no hace cambios directos a esas ramas.
