#!/bin/sh
set -eu

index=/usr/share/nginx/html/index.html
temporary="${index}.tmp"

envsubst '${SITE_URL} ${CLARITY_ID}' < "$index" > "$temporary"
mv "$temporary" "$index"
