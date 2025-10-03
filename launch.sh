#!/bin/bash
set -euo pipefail

# Source utilities (logging, checks, helpers)
UTILS_FILE="$(dirname "$0")/scripts/launch-utils.sh"
if [ -f "$UTILS_FILE" ]; then
  # shellcheck disable=SC1090
  . "$UTILS_FILE"
else
  echo "[launch] Missing $UTILS_FILE; aborting." >&2
  exit 1
fi

# Project-specific mapping of profiles to services
available_profiles() {
    # Static list aligned with docker-compose.yml
    echo "proxy dev testing observability monitoring tools nocode"
}

profile_services() {
    case "$1" in
        proxy) echo "traefik" ;;
        dev) echo "mailhog" ;;
        testing) echo "selenium" ;;
        observability) echo "elasticsearch kibana apm-server filebeat" ;;
        monitoring) echo "netdata portainer" ;;
        tools) echo "docker-socket-proxy" ;;
        nocode) echo "nocodb" ;;
        *) echo "" ;;
    esac
}

summarize_selected_profiles() {
    local profiles="$*"
    local services=""
    for p in $profiles; do
        services+=" $(profile_services "$p")"
    done
    # de-duplicate while preserving order
    printf "%s\n" $services | awk '!seen[$0]++' | xargs 2>/dev/null || true
}

# Prompt the user with presets for typical scenarios and return selected profiles
choose_profiles_with_presets() {
    local DEFAULT_PROFILES="proxy dev"
    echo
    section "Choix d'un preset de profils" "🧰"
    cat >&2 <<'MENU'
1) Dev rapide           → proxy dev           (web, db, traefik, mailhog)
2) Dev + Observability  → proxy dev observability (web, db, traefik, mailhog, es, kibana, apm, filebeat)
3) Testing (Selenium)   → testing proxy       (web, db, selenium, traefik)
4) Monitoring & Tools   → monitoring tools proxy (web, db, netdata, portainer, docker-socket-proxy, traefik)
5) Nocode (NocoDB)      → nocode proxy       (web, db, nocodb, traefik)
6) Minimal              → (aucun profil)     (web, db seulement)
7) Personnalisé         → saisir les profils séparés par des espaces
MENU
    local choice
    read -r -p "Votre choix [1] : " choice
    case "${choice:-1}" in
        1) echo "proxy dev" ;;
        2) echo "proxy dev observability" ;;
        3) echo "testing proxy" ;;
        4) echo "monitoring tools proxy" ;;
        5) echo "nocode proxy" ;;
        6) echo "" ;;
        7)
            local custom
            read -r -p "Profils personnalisés (ex: 'proxy dev testing'): " custom
            echo "$custom"
            ;;
        *)
            warn "Choix invalide, utilisation du preset par défaut (${DEFAULT_PROFILES})."
            echo "$DEFAULT_PROFILES"
            ;;
    esac
}

choose_and_launch() {
    local DEFAULT_PROFILES="proxy dev"
    echo
    section "Sélection des profils & lancement" "🚀"
    local SELECTED
    SELECTED=$(choose_profiles_with_presets)
    if [ -z "$SELECTED" ]; then
        info "Aucun profil sélectionné (mode minimal)."
    else
        echo "Profils retenus: $SELECTED"
    fi

    # Show a short summary of implied services
    local implied
    implied=$(summarize_selected_profiles $SELECTED)
    if [ -n "$implied" ]; then
        echo "Services ajoutés via profils: $implied"
    fi

    # Build compose args
    local -a compose_args=()
    for p in $SELECTED; do
        compose_args+=(--profile "$p")
    done

    echo "Lancement: docker compose ${compose_args[*]} up -d"
    docker compose "${compose_args[@]}" up -d
}

# Run preflight, then runtime preflight, then ports check, then prompt profiles and start
preflight
runtime_preflight
check_ports
choose_and_launch
exit 0
