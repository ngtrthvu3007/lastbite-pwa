#!/usr/bin/env sh
set -eu

target="${1:-all}"
detached=""

case "$target" in
  infra|api|customer|merchant|frontend|all) ;;
  -d|--detach|--detached)
    target="all"
    detached="-d"
    ;;
  *)
    echo "Usage: $0 [infra|api|customer|merchant|frontend|all] [-d|--detach]" >&2
    exit 1
    ;;
esac

if [ "${2:-}" = "-d" ] || [ "${2:-}" = "--detach" ] || [ "${2:-}" = "--detached" ]; then
  detached="-d"
fi

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
repo_root="$(dirname "$script_dir")"
env_file="$repo_root/docker/dev/.env"
example_env_file="$repo_root/docker/dev/.env.example"

if [ ! -f "$env_file" ]; then
  cp "$example_env_file" "$env_file"
  echo "Created docker/dev/.env from docker/dev/.env.example. Review it if you need different local credentials."
fi

case "$target" in
  infra) services="postgres redis rabbitmq minio" ;;
  api) services="postgres redis rabbitmq minio lb-api" ;;
  customer) services="lb-customer" ;;
  merchant) services="lb-merchant" ;;
  frontend) services="lb-customer lb-merchant" ;;
  all) services="postgres redis rabbitmq minio lb-api lb-customer lb-merchant" ;;
esac

echo "Starting LastBite local dev target '$target': $services"

cd "$repo_root"
if [ "$target" = "api" ]; then
  docker compose --env-file "$env_file" up --build -d postgres redis rabbitmq minio
  # shellcheck disable=SC2086
  docker compose --env-file "$env_file" up --build --force-recreate --no-deps $detached lb-api
else
  # shellcheck disable=SC2086
  docker compose --env-file "$env_file" up --build $detached $services
fi
