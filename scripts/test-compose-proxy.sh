#!/bin/sh
set -eu

compose="docker compose --project-name tefy-blog-integration --env-file .env.example -f compose.production.yaml -f compose.integration.yaml"
eval "$compose down --volumes --remove-orphans >/dev/null 2>&1 || true"
cleanup() { eval "$compose down --volumes --remove-orphans >/dev/null 2>&1 || true"; }
trap cleanup EXIT

set -a
. ./.env.example
set +a
PROD_FRONTEND_PORT=18092
PROD_BACKEND_PORT=18091
export PROD_FRONTEND_PORT PROD_BACKEND_PORT

eval "$compose up --build -d"
headers=$(mktemp)
body=$(mktemp)
cookies=$(mktemp)
trap 'rm -f "$headers" "$body" "$cookies"; cleanup' EXIT

status=
for attempt in $(seq 1 60); do
  status=$(curl -sS --max-time 3 -o "$body" -D "$headers" -w '%{http_code}' http://127.0.0.1:$PROD_FRONTEND_PORT/api/v1/auth/session || true)
  [ "$status" = "401" ] && break
  sleep 2
done
[ "$status" = "401" ] || { echo "Unauthenticated session should return 401 through frontend proxy (got $status)"; cat "$body"; exit 1; }
grep -qi '^content-type: application/json' "$headers"
grep -q 'unauthorized' "$body"

status=$(curl -sS --max-time 5 -o "$body" -D "$headers" -w '%{http_code}' http://127.0.0.1:$PROD_FRONTEND_PORT/api/v1/admin/content)
[ "$status" = "401" ] || { echo "Admin API should reject unauthenticated access (got $status)"; exit 1; }

status=$(curl -sS --max-time 5 -o "$body" -D "$headers" -c "$cookies" -w '%{http_code}' http://127.0.0.1:$PROD_FRONTEND_PORT/api/v1/auth/csrf)
[ "$status" = "200" ] || { echo "CSRF endpoint should return 200 JSON (got $status)"; exit 1; }
csrf=$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).token || "")' "$body")
[ -n "$csrf" ] || { echo "CSRF endpoint did not return a token"; exit 1; }
payload=$(BOOTSTRAP_ADMIN_USERNAME="$BOOTSTRAP_ADMIN_USERNAME" BOOTSTRAP_ADMIN_PASSWORD="$BOOTSTRAP_ADMIN_PASSWORD" node -e 'process.stdout.write(JSON.stringify({username:process.env.BOOTSTRAP_ADMIN_USERNAME,password:process.env.BOOTSTRAP_ADMIN_PASSWORD}))')
status=$(curl -sS --max-time 10 -o "$body" -D "$headers" -b "$cookies" -c "$cookies" -H 'Content-Type: application/json' -H "X-CSRF-Token: $csrf" --data "$payload" -w '%{http_code}' http://127.0.0.1:$PROD_FRONTEND_PORT/api/v1/auth/login)
[ "$status" = "200" ] || { echo "Login through frontend proxy should succeed (got $status)"; cat "$body"; exit 1; }
grep -q '"authenticated":true' "$body"

status=$(curl -sS --max-time 5 -o "$body" -b "$cookies" -w '%{http_code}' http://127.0.0.1:$PROD_FRONTEND_PORT/api/v1/auth/session)
[ "$status" = "200" ] || { echo "Authenticated session should return 200 through frontend proxy (got $status)"; exit 1; }
grep -q '"authenticated":true' "$body"

status=$(curl -sS --max-time 5 -o "$body" -D "$headers" -w '%{http_code}' http://127.0.0.1:$PROD_FRONTEND_PORT/robots.txt)
[ "$status" = "200" ] || { echo "robots.txt proxy should return 200 (got $status)"; exit 1; }
grep -q "Sitemap: $SITE_URL/api/v1/public/sitemap.xml" "$body"

echo 'Frontend-to-backend proxy, auth, and runtime env integration passed.'
