#!/bin/bash
set -euo pipefail

bold() { printf "\033[1m%s\033[0m\n" "$*"; }
ok() { printf "[OK] %s\n" "$*"; }
warn() { printf "[WARN] %s\n" "$*"; }
err() { printf "[ERROR] %s\n" "$*"; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

# Ensure .env exists or offer to create it from .env.example (single source of truth)
ensure_env() {
    if [ ! -f ./.env ]; then
        warn "Fichier .env introuvable à la racine du projet."
        if [ -f ./.env.example ]; then
            read -r -p "Créer .env à partir de .env.example ? [Y/n] " REPLY
            REPLY=${REPLY:-Y}
            if [[ "$REPLY" =~ ^[Yy]$ ]]; then
                cp ./.env.example ./.env
                ok ".env créé depuis .env.example."
            else
                err "Création de .env annulée. Veuillez créer .env (copie de .env.example) puis relancer."
                exit 1
            fi
        else
            err "Aucun .env.example trouvé. Veuillez ajouter .env.example au dépôt, puis relancer."
            exit 1
        fi
    fi
}

load_env() {
    # export variables from .env without echoing values
    if [ -f ./.env ]; then
        # shellcheck disable=SC1091
        set -a; . ./.env; set +a
        ok ".env chargé."
    else
        warn "Aucun .env à charger."
    fi
}

check_docker() {
    bold "Préflight: vérification de l'environnement Docker"
    if ! command_exists docker; then
        err "Docker n'est pas installé ou introuvable dans le PATH."
        exit 1
    fi
    if ! docker info >/dev/null 2>&1; then
        err "Docker daemon indisponible. Démarrez Docker puis réessayez."
        exit 1
    fi
    ok "Docker opérationnel."

    if ! docker compose version >/dev/null 2>&1; then
        err "Plugin Docker Compose V2 indisponible (commande 'docker compose')."
        exit 1
    fi
    ok "Docker Compose V2 disponible."

    if ! docker compose config -q; then
        err "docker-compose.yml invalide. Corrigez la configuration."
        exit 1
    fi
    ok "docker-compose.yml valide."

    # Optional: check docker.sock
    if [ -S /var/run/docker.sock ]; then
        ok "docker.sock accessible."
    else
        warn "docker.sock introuvable; certains services (traefik, filebeat) peuvent échouer."
    fi

    # ES requirement: vm.max_map_count
    if [ -r /proc/sys/vm/max_map_count ]; then
        local mmc
        mmc=$(cat /proc/sys/vm/max_map_count || echo 0)
        if [ "$mmc" -lt 262144 ]; then
            warn "vm.max_map_count=$mmc (<262144). Elasticsearch peut ne pas démarrer de façon optimale."
        else
            ok "vm.max_map_count=$mmc (OK)."
        fi
    fi
}

port_in_use() {
    local PORT=$1
    # check TCP listen on IPv4/IPv6
    ss -ltn 2>/dev/null | awk '{print $4}' | grep -E "(^|:)${PORT}$" >/dev/null 2>&1
}

check_ports() {
    bold "Préflight: vérification des ports d'écoute sur l'hôte"
    local -a PORTS=(
        "${TRAEFIK_HTTP_PORT:-80}"
        "${WEB_HTTP_PORT:-8080}"
        "${VITE_PORT:-5173}"
        "${DB_PORT:-3306}"
        "${ES_HTTP_PORT:-9200}"
        "${KIBANA_PORT:-5601}"
        "${APM_PORT:-8200}"
        "${MAILHOG_SMTP_PORT:-1025}"
        "${MAILHOG_HTTP_PORT:-8025}"
        "${NETDATA_PORT:-19999}"
        "${PORTAINER_PORT:-9000}"
        "${NOCODB_PORT:-8081}"
        "${SELENIUM_WEBDRIVER_PORT:-4444}"
        "${SELENIUM_UI_PORT:-7900}"
    )
    local CONFLICTS=()
    for P in "${PORTS[@]}"; do
        if port_in_use "$P"; then
            CONFLICTS+=("$P")
        fi
    done
    if [ ${#CONFLICTS[@]} -gt 0 ]; then
        warn "Ports déjà utilisés: ${CONFLICTS[*]}"
        read -r -p "Continuer malgré tout ? [y/N] " RESP
        if [[ ! "${RESP:-N}" =~ ^[Yy]$ ]]; then
            err "Arrêt suite aux conflits de ports. Modifiez votre .env puis relancez."
            exit 1
        fi
    else
        ok "Aucun conflit de ports détecté."
    fi
}

preflight() {
    ensure_env
    load_env
    check_docker
    check_ports
    ok "Préflight terminé."
}

# Run preflight checks only
preflight
echo "[launch.sh] Préflight terminé (aucune action de déploiement exécutée)."
exit 0
