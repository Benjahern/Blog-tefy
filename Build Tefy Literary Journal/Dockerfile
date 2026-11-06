FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./

FROM base AS dependencies
RUN pnpm install --frozen-lockfile

FROM dependencies AS development
COPY . .
EXPOSE 8443
CMD ["pnpm", "dev", "--", "--host", "0.0.0.0", "--port", "8443"]

FROM dependencies AS build
COPY . .
RUN pnpm build

FROM nginx:1.27-alpine AS production
ENV API_UPSTREAM=http://backend:8080 \
    NGINX_ENVSUBST_FILTER=^API_UPSTREAM$
RUN apk add --no-cache gettext
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY docker-entrypoint/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
