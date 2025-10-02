#!/bin/bash
set -e

# Ensure .env exists or offer to create it from .env.example
if [ ! -f ./.env ]; then
    echo "[launch.sh] Attention: fichier .env introuvable à la racine du projet."
    if [ -f ./.env.example ]; then
        read -r -p "Voulez-vous créer .env à partir de .env.example ? [Y/n] " REPLY
        REPLY=${REPLY:-Y}
        if [[ "$REPLY" =~ ^[Yy]$ ]]; then
            cp ./.env.example ./.env
            echo "[launch.sh] .env créé depuis .env.example. Vous pouvez l'éditer si besoin."
        else
            echo "[launch.sh] .env non créé. Certaines valeurs par défaut de docker-compose seront utilisées."
        fi
    else
        echo "[launch.sh] Aucun .env.example trouvé non plus. Veuillez créer un fichier .env manuellement."
        read -r -p "Souhaitez-vous créer un .env minimal maintenant ? [y/N] " REPLY2
        if [[ "$REPLY2" =~ ^[Yy]$ ]]; then
            cat > ./.env <<'EOF'
COMPOSE_PROJECT_NAME=dev-php
DOMAIN=localhost
TZ=Europe/Paris
LOG_WEB_PATH=/var/logs/web

# Ports (host side)
TRAEFIK_HTTP_PORT=80
WEB_HTTP_PORT=8080
VITE_PORT=5173
SELENIUM_WEBDRIVER_PORT=4444
SELENIUM_UI_PORT=7900
MAILHOG_SMTP_PORT=1025
MAILHOG_HTTP_PORT=8025
NETDATA_PORT=19999
DB_BIND_ADDR=0.0.0.0
DB_PORT=3306
ES_HTTP_PORT=9200
KIBANA_PORT=5601
APM_PORT=8200
PORTAINER_PORT=9000
NOCODB_PORT=8081

# Database (server)
MARIADB_ROOT_PASSWORD=rootpass
MARIADB_DATABASE=myurgo
MARIADB_USER=root
MARIADB_PASSWORD=rootpass
MARIADB_ROOT_HOST=%

# Database (app)
MYSQL_HOST=db
MYSQL_DATABASE=dev
MYSQL_USER=root
MYSQL_PASSWORD=rootpass
EOF
            echo "[launch.sh] .env minimal créé."
        else
            echo "[launch.sh] Arrêt: pas de .env et refus de création."
            exit 1
        fi
    fi
fi

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
