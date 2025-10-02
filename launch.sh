#!/bin/bash
set -e

# check if ssh keys exist
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "SSH private key not found at ~/.ssh/id_rsa. Please create one and add it to your SSH agent."

    echo "To create a new SSH key, use the following command:"
    echo 'ssh-keygen -t rsa -b 4096 -C "your_email"'

    exit 1
fi


cp ~/.ssh/id_rsa ./docker/id_rsa
cp ~/.bashrc ./docker/.bashrc

# Reset only the application logs volume (simple and safe for dev)
echo "[launch.sh] Resetting app_logs volume contents..."
docker compose run --rm --no-deps -u root web sh -lc 'rm -rf "${LOG_WEB_PATH:-/var/logs/web}"/* || true'

docker compose build && docker compose up
