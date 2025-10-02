#!/usr/bin/env bash
set -e

# Launch both PHP-FPM 7.4 and 8.4 then Apache in foreground

mkdir -p /run/php
chown www-data:www-data /run/php || true

if command -v php-fpm7.4 >/dev/null 2>&1; then
  echo "[start.sh] Starting php-fpm7.4"
  php-fpm7.4 -D
fi
if command -v php-fpm8.4 >/dev/null 2>&1; then
  echo "[start.sh] Starting php-fpm8.4"
  php-fpm8.4 -D
fi

if command -v php-fpm8.3 >/dev/null 2>&1; then
  echo "[start.sh] Starting php-fpm8.3"
  php-fpm8.3 -D
fi


chown -R www-data:www-data /var/logs/web


# Show sockets
ls -l /run/php || true

echo "[start.sh] Starting Apache"
exec apache2ctl -D FOREGROUND
