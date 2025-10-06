#!/usr/bin/env bash

# Laravel full initialization inside Docker web container.
# - Ensures services are up
# - Creates .env if missing and sets APP_URL
# - composer install, key:generate
# - migrate --force, db:seed --force
# - storage:link
# Usage: run from anywhere. Optional env: APP_URL=http://web.localhost ./scripts/install-laravel.sh

set -euo pipefail

APP_URL_DEFAULT="http://web.localhost"
APP_URL_ENV="${APP_URL:-$APP_URL_DEFAULT}"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Find repo root by searching upwards for docker-compose.yml
find_repo_root() {
  local d="$script_dir"
  while [ "$d" != "/" ]; do
    if [ -f "$d/docker-compose.yml" ]; then
      echo "$d"
      return 0
    fi
    d="$(dirname "$d")"
  done
  # Fallback: parent of script_dir
  dirname "$script_dir"
}
repo_root="$(find_repo_root)"

cd "$repo_root"

echo "[info] Repository root: $repo_root"

compose() {
  docker compose "$@"
}

in_web() {
  # Run as www-data in web container
  compose exec -u www-data web bash -lc "$*"
}

ensure_stack() {
  echo "[step] Starting required services (db, web) if needed…"
  if ! compose ps -q db >/dev/null 2>&1 || [ -z "$(compose ps -q db)" ]; then
    compose up -d db
  fi
  if ! compose ps -q web >/dev/null 2>&1 || [ -z "$(compose ps -q web)" ]; then
    compose up -d web
  fi
}

wait_db() {
  echo "[step] Waiting for database to be ready…"
  # Use mysqladmin ping from inside the web container (mariadb-client installed)
  local timeout=60
  local start_ts
  start_ts=$(date +%s)
  while true; do
    if in_web "mysqladmin ping -h db -uroot -prootpass --silent" >/dev/null 2>&1; then
      echo "[ok] Database is ready."
      break
    fi
  local now
  now=$(date +%s)
  if (( now - start_ts > timeout )); then
      echo "[warn] DB not ready after ${timeout}s; continuing anyway."
      break
  fi
    sleep 2
  done
}

prepare_env() {
  echo "[step] Preparing .env"
  in_web "cd /var/www/html/laravel && [ -f .env ] || cp .env.example .env"
  # Set APP_URL if not present or different
  in_web "cd /var/www/html/laravel && \
    if ! grep -q '^APP_URL=' .env; then \
      echo 'APP_URL=$APP_URL_ENV' >> .env; \
    else \
      sed -i 's#^APP_URL=.*#APP_URL=$APP_URL_ENV#' .env; \
    fi"
}

install_php() {
  echo "[step] Composer install + key:generate"
  in_web "cd /var/www/html/laravel && composer install --no-interaction --prefer-dist"
  # Generate key (idempotent; --force overwrites if needed)
  in_web "cd /var/www/html/laravel && php artisan key:generate --force || true"
}

migrate_seed() {
  echo "[step] Migrate + Seed"
  in_web "cd /var/www/html/laravel && php artisan migrate --force"
  in_web "cd /var/www/html/laravel && php artisan db:seed --force || true"
}

post_setup() {
  echo "[step] Storage link + optimize:clear"
  in_web "cd /var/www/html/laravel && php artisan storage:link || true"
  in_web "cd /var/www/html/laravel && php artisan optimize:clear || true"
}

echo "[init] Laravel initialization starting…"
ensure_stack
wait_db
prepare_env
install_php
migrate_seed
post_setup

echo "[done] Laravel ready at: ${APP_URL_ENV}"
echo "[info] Filament admin: ${APP_URL_ENV}/admin"
echo "[info] Default login: admin@example.com / password (if seed applied)."
