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

# Newly published reviews must immediately return crawlable, per-review HTML.
content=$(cat <<'JSON'
{"version":1,"books":[{"id":"seo-book","title":"Libro SEO de prueba","author":"Autora de prueba","coverUrl":"/cover.jpg","genreIds":[]}],"reviews":[{"id":"seo-review","bookId":"seo-book","slug":"seo-review-fixture","status":"published","title":"Texto único de la reseña","excerpt":"Descripción indexable de prueba.","content":"<p>Contenido visible para buscadores y lectores.</p><script>alert(1)</script>","rating":4.5,"createdAt":"2026-01-01T00:00:00Z","updatedAt":"2026-01-02T00:00:00Z","publishedAt":"2026-01-02T00:00:00Z"},{"id":"draft-review","bookId":"seo-book","slug":"seo-draft-fixture","status":"draft","title":"Borrador privado","excerpt":"No debe indexarse.","content":"<p>Contenido privado.</p>","rating":4,"createdAt":"2026-01-01T00:00:00Z","updatedAt":"2026-01-02T00:00:00Z"}],"genres":[],"series":[],"settings":{"siteName":"Nia","profileName":"Nia"}}
JSON
)
status=$(curl -sS --max-time 10 -o "$body" -w '%{http_code}' -b "$cookies" -H 'Content-Type: application/json' -H "X-CSRF-Token: $csrf" -X PUT --data "$content" http://127.0.0.1:$PROD_FRONTEND_PORT/api/v1/admin/content)
[ "$status" = "204" ] || { echo "Saving public SEO fixture should return 204 (got $status)"; cat "$body"; exit 1; }

status=$(curl -sS --max-time 10 -o "$body" -D "$headers" -w '%{http_code}' http://127.0.0.1:$PROD_FRONTEND_PORT/resenas/seo-review-fixture)
[ "$status" = "200" ] || { echo "Published review should return server-rendered HTML (got $status)"; cat "$body"; exit 1; }
grep -q 'Libro SEO de prueba — reseña | Nia' "$body"
grep -q 'Descripción indexable de prueba.' "$body"
grep -q 'Contenido visible para buscadores y lectores.' "$body"
grep -q 'application/ld+json' "$body"
grep -q 'src="/assets/app.js"' "$body"
! grep -q 'alert(1)' "$body"

status=$(curl -sS --max-time 10 -o "$body" -w '%{http_code}' http://127.0.0.1:$PROD_FRONTEND_PORT/resenas/seo-draft-fixture)
[ "$status" = "404" ] || { echo "Draft review must not be publicly rendered (got $status)"; exit 1; }

status=$(curl -sS --max-time 5 -o "$body" -D "$headers" -w '%{http_code}' http://127.0.0.1:$PROD_FRONTEND_PORT/robots.txt)
[ "$status" = "200" ] || { echo "robots.txt proxy should return 200 (got $status)"; exit 1; }
grep -q "Sitemap: $SITE_URL/api/v1/public/sitemap.xml" "$body"
status=$(curl -sS --max-time 5 -o "$body" -w '%{http_code}' http://127.0.0.1:$PROD_FRONTEND_PORT/api/v1/public/sitemap.xml)
[ "$status" = "200" ] || { echo "sitemap should return 200 (got $status)"; exit 1; }
grep -q "$SITE_URL/resenas/seo-review-fixture" "$body"
! grep -q 'seo-draft-fixture' "$body"

echo 'Frontend-to-backend proxy, auth, runtime config, and per-review SEO integration passed.'
