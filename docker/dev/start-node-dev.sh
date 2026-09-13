#!/bin/sh
set -eu

app_name="$1"
shift

cache_dir="/opt/$app_name"
hash_file="node_modules/.lastbite-package-lock.sha256"
current_hash="$(sha256sum package-lock.json | awk '{print $1}')"
cached_hash=""

if [ -f "$hash_file" ]; then
  cached_hash="$(cat "$hash_file")"
fi

if [ ! -d node_modules/.bin ] || [ "$cached_hash" != "$current_hash" ]; then
  echo "Syncing cached dependencies for $app_name..."
  mkdir -p node_modules
  find node_modules -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  cp -a "$cache_dir/node_modules/." node_modules/
  printf "%s" "$current_hash" > "$hash_file"
fi

exec "$@"
