#!/usr/bin/env bash
set -euo pipefail

log() { printf '[start.sh] %s\n' "$*"; }

# 1) Lister automatiquement les versions PHP présentes sous /etc/php
mapfile -t PHP_VERSIONS < <(ls -d /etc/php/* 2>/dev/null | awk -F'/' '{print $4}' | sort -Vr)

# 2) Désactiver Xdebug en CLI si le .ini existe
for v in "${PHP_VERSIONS[@]}"; do
  ini="/etc/php/$v/cli/conf.d/20-xdebug.ini"
  if [[ -f "$ini" ]]; then
    mv "$ini" "$ini.disabled"
    log "Xdebug CLI disabled for PHP $v"
  fi
done

# 3) Préparer dossiers (logs, cache composer/npm)
mkdir -p /run/php
chown www-data:www-data /run/php || true
LOG_DIR="${LOG_WEB_PATH:-/var/logs/web}"
mkdir -p "$LOG_DIR" && chown -R www-data:www-data "$LOG_DIR" || true
log "Using log directory: $LOG_DIR"

mkdir -p /tmp/composer && chown -R www-data:www-data /tmp/composer || true
mkdir -p /var/www/.npm && chown -R www-data:www-data /var/www/.npm || true

# 4) Lancer tous les php-fpm trouvés (7.4, 8.3, 8.4, etc.)
for v in "${PHP_VERSIONS[@]}"; do
  bin="php-fpm$v"
  if command -v "$bin" >/dev/null 2>&1; then
    log "Starting $bin"
    "$bin" -D
  fi
done

# 5) Afficher les sockets FPM visibles
ls -l /run/php || true

# 6) Démarrer Apache en foreground
log "Starting Apache"
exec apache2ctl -D FOREGROUND



