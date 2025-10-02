#!/usr/bin/env bash

# Disable Xdebug for PHP-FPM by renaming 99-xdebug.ini -> 99-xdebug.ini.disabled
# then restart the FPM services. Keep it simple and explicit.

# Self-elevate if not root (www-data has NOPASSWD sudo in this image)
if [ "$(id -u)" -ne 0 ]; then
	exec sudo -n bash "$0" "$@"
fi

set -u

versions=(7.4 8.3 8.4)
changed=()

for v in "${versions[@]}"; do
	dir="/etc/php/${v}/fpm/conf.d"
	src="${dir}/99-xdebug.ini"
	dst="${dir}/99-xdebug.ini.disabled"

	if [ -f "$src" ]; then
		echo "Disabling Xdebug for php-fpm${v}: $src -> $dst"
		mv "$src" "$dst"
		changed+=("$v")
	else
		if [ -f "$dst" ]; then
			echo "Xdebug already disabled for php-fpm${v} (found $dst)"
		else
			echo "No Xdebug conf found for php-fpm${v} (missing $src) — skipping"
		fi
	fi
done

restart_fpm() {
	local v="$1"
	echo "Restarting php${v}-fpm"
	if command -v service >/dev/null 2>&1; then
		service "php${v}-fpm" restart >/dev/null 2>&1 && return 0
		# try stop/start if restart failed
		service "php${v}-fpm" stop >/dev/null 2>&1
		service "php${v}-fpm" start >/dev/null 2>&1 && return 0
	fi

	# Fallback: try killing master and re-spawning in daemon mode
	if [ -f "/run/php/php${v}-fpm.pid" ]; then
		kill -TERM "$(cat "/run/php/php${v}-fpm.pid")" 2>/dev/null || true
		sleep 1
	fi
	if command -v "php-fpm${v}" >/dev/null 2>&1; then
		"php-fpm${v}" -D >/dev/null 2>&1 && return 0
	fi

	echo "Warning: Could not restart php${v}-fpm automatically. Please restart it manually." >&2
	return 1
}

if [ ${#changed[@]} -eq 0 ]; then
	echo "Nothing changed. No php-fpm restart needed."
	exit 0
fi

for v in "${changed[@]}"; do
	restart_fpm "$v" || true
done

echo "Xdebug disabled for: ${changed[*]}"

