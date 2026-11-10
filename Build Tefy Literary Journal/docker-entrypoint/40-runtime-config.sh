#!/bin/sh
set -eu

index=/usr/share/nginx/html/index.html
temporary=$(mktemp)
trap 'rm -f "$temporary"' EXIT

envsubst '${SITE_URL} ${CLARITY_ID}' < "$index" > "$temporary"
cat "$temporary" > "$index"
