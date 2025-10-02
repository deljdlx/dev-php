#!/bin/bash
set -euo pipefail

# --- Logging with levels, colors, and emojis ---
# Configure with env:
#   LOG_LEVEL=DEBUG|INFO|NOTICE|WARN|ERROR (default INFO)
#   NO_COLOR=1 to disable ANSI colors
#   NO_EMOJI=1 to disable emojis
LOG_LEVEL=${LOG_LEVEL:-INFO}

_supports_color() {
    [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]
}

# ANSI colors (only if supported)
if _supports_color; then
    CLR_RESET='\033[0m'
    CLR_BOLD='\033[1m'
    CLR_RED='\033[31m'
    CLR_GREEN='\033[32m'
    CLR_YELLOW='\033[33m'
    CLR_BLUE='\033[34m'
    CLR_CYAN='\033[36m'
else
    CLR_RESET=''
    CLR_BOLD=''
    CLR_RED=''
    CLR_GREEN=''
    CLR_YELLOW=''
    CLR_BLUE=''
    CLR_CYAN=''
fi

# Emojis (optional)
if [[ -n "${NO_EMOJI:-}" ]]; then
    EMOJI_OK="[OK]"
    EMOJI_INFO="[INFO]"
    EMOJI_NOTICE="[NOTICE]"
    EMOJI_WARN="[WARN]"
    EMOJI_ERR="[ERROR]"
    EMOJI_DBG="[DBG]"
else
    EMOJI_OK="✅"
    EMOJI_INFO="ℹ️ "
    EMOJI_NOTICE="📣"
    EMOJI_WARN="⚠️ "
    EMOJI_ERR="❌"
    EMOJI_DBG="🛠️ "
fi

_level_to_num() {
    case "${1^^}" in
        DEBUG) echo 10 ;;
        INFO) echo 20 ;;
        NOTICE) echo 25 ;;
        WARN|WARNING) echo 30 ;;
        ERROR|ERR) echo 40 ;;
        *) echo 20 ;;
    esac
}

_should_log() {
    local req lvl
    req=$(_level_to_num "$LOG_LEVEL")
    lvl=$(_level_to_num "$1")
    # Log if message severity >= configured threshold
    [[ "$lvl" -ge "$req" ]]
}

_log() {
    local level msg color emoji stream
    level=${1:-INFO}; shift || true
    msg="$*"
    stream=1
    case "${level^^}" in
        DEBUG)  color="$CLR_CYAN";   emoji="$EMOJI_DBG" ;;
        INFO)   color="$CLR_BLUE";   emoji="$EMOJI_INFO" ;;
        NOTICE) color="$CLR_BOLD";   emoji="$EMOJI_NOTICE" ;;
        WARN|WARNING)  color="$CLR_YELLOW"; emoji="$EMOJI_WARN"; stream=1 ;;
        ERROR|ERR)     color="$CLR_RED";    emoji="$EMOJI_ERR" ; stream=2 ;;
        SUCCESS|OK)    color="$CLR_GREEN";  emoji="$EMOJI_OK" ;;
        *)      color="$CLR_RESET";  emoji="" ;;
    esac
    _should_log "$level" || return 0
    if [[ "$stream" -eq 2 ]]; then
        printf "%b%s%b %s\n" "$color" "$emoji" "$CLR_RESET" "$msg" 1>&2
    else
        printf "%b%s%b %s\n" "$color" "$emoji" "$CLR_RESET" "$msg"
    fi
}

bold() { printf "%b%s%b\n" "$CLR_BOLD" "$*" "$CLR_RESET"; }
ok()   { _log SUCCESS "$*"; }
warn() { _log WARN "$*"; }
err()  { _log ERROR "$*"; }
info() { _log INFO "$*"; }
debug(){ _log DEBUG "$*"; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

# Read a meminfo field value in kB
meminfo_kb() {
    local KEY=$1
    awk -v k="$KEY" '$1==k":" {print $2; found=1} END{ if(!found) print 0 }' /proc/meminfo 2>/dev/null || echo 0
}

check_ram() {
    bold "Préflight: vérification de la mémoire RAM"
    if [ ! -r /proc/meminfo ]; then
        warn "/proc/meminfo non accessible; impossible d'évaluer la RAM."
        return 0
    fi

    local total_kb avail_kb total_mb avail_mb
    total_kb=$(meminfo_kb MemTotal)
    avail_kb=$(meminfo_kb MemAvailable)

    # Fallback si MemAvailable indisponible
    if [ "${avail_kb:-0}" -eq 0 ]; then
        local free_kb buff_kb cached_kb
        free_kb=$(meminfo_kb MemFree)
        buff_kb=$(meminfo_kb Buffers)
        cached_kb=$(meminfo_kb Cached)
        avail_kb=$(( free_kb + buff_kb + cached_kb ))
    fi

    total_mb=$(( total_kb / 1024 ))
    avail_mb=$(( avail_kb / 1024 ))

    # Seuils (indicatifs pour ES/Kibana + stack):
    # - Total recommandé: >= 4096 MB
    # - Disponible recommandé avant lancement: >= 1536 MB
    local min_total_mb=4096
    local min_avail_mb=1536

    # Formatage en Go avec 1 décimale via awk (évite dépendance à bc)
    local total_g avail_g
    total_g=$(awk -v m="$total_mb" 'BEGIN{printf "%.1f", m/1024}')
    avail_g=$(awk -v m="$avail_mb" 'BEGIN{printf "%.1f", m/1024}')

    if [ "$total_mb" -lt "$min_total_mb" ]; then
        warn "RAM totale: ${total_g}G (< 4.0G recommandé). La stack peut être lente/instable."
    else
        ok "RAM totale: ${total_g}G"
    fi

    if [ "$avail_mb" -lt "$min_avail_mb" ]; then
        warn "RAM disponible: ${avail_g}G (< 1.5G). Fermez des applications ou ajustez la config avant 'docker compose up'."
    else
        ok "RAM disponible: ${avail_g}G"
    fi
}

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
                echo "Options:"
                echo "  [K] Kill & relancer la stack docker compose du projet"
                echo "  [C] Continuer malgré tout (risque d'échec au lancement)"
                echo "  [S] Stopper (défaut)"
                read -r -p "Votre choix [k/C/s]: " ACTION
                ACTION=${ACTION:-s}
                case "${ACTION,,}" in
                    k)
                        echo "Arrêt de la stack du projet..."
                        docker compose down --remove-orphans || true
                        ok "Stack arrêtée. Relance..."
                        choose_and_launch
                        exit 0
                        ;;
                    c)
                        warn "Poursuite malgré les conflits de ports."
                        ;;
                    *)
                        err "Arrêt suite aux conflits de ports. Modifiez votre .env ou libérez les ports, puis relancez."
                        exit 1
                        ;;
                esac
    else
        ok "Aucun conflit de ports détecté."
    fi
}

preflight() {
    ensure_env
    load_env
    check_docker
    check_ram
    ok "Préflight terminé."

}

# ---- Runtime preflight helpers ----
# Return full `docker compose ps` output (or empty on error)
compose_ps() {
    docker compose ps 2>/dev/null || true
}

# Echo names of services that are currently Up (running)
get_running_services() {
    compose_ps | awk 'NR>1 && $0 ~ /\bUp\b/ {print $1}'
}

# Pretty print current compose process table
print_services_status() {
    local ps_out
    ps_out=$(compose_ps)
    if [ -n "$ps_out" ]; then
        echo "$ps_out"
    else
        echo "(aucune sortie)"
    fi
}

# Ask user whether to stop running services; returns 0 if yes, 1 otherwise
prompt_stop_running() {
    read -r -p "Voulez-vous arrêter les services en cours avant relance ? [Y/n] " ans
    ans=${ans:-Y}
    [[ "$ans" =~ ^[Yy]$ ]]
}

# Stop current compose services
stop_running_services() {
    docker compose down --remove-orphans
}

# Main runtime preflight orchestrator
runtime_preflight() {
    bold "Runtime preflight: état des services du projet"
    local running
    running=$(get_running_services || true)
    if [ -n "$running" ]; then
        echo "Des services sont déjà en cours d'exécution:"
        print_services_status
        if prompt_stop_running; then
            echo "Arrêt des services en cours..."
            stop_running_services
            ok "Services arrêtés."
        else
            warn "Conservation des services en cours. Le lancement peut conserver/mettre à jour l'existant."
            read -r -p "Souhaitez-vous continuer malgré tout ? [y/N] " cont
            cont=${cont:-N}
            if [[ ! "$cont" =~ ^[Yy]$ ]]; then
                err "Arrêt demandé par l'utilisateur."
                exit 1
            fi
        fi
    else
        ok "Aucun service du projet n'est en cours d'exécution."
    fi
}
# Prompt user to choose profiles and launch
available_profiles() {
    # Static list aligned with docker-compose.yml
    echo "proxy dev testing observability monitoring tools nocode"
}

choose_and_launch() {
    local DEFAULT_PROFILES="proxy dev"
    echo
    bold "Sélection des profils à lancer"
    local AVAIL
    AVAIL=$(available_profiles || true)
    if [ -n "$AVAIL" ]; then
        echo "Profils disponibles détectés: $AVAIL"
    else
        echo "Aucun profil détecté automatiquement (ou parsing limité). Vous pouvez tout de même saisir des profils connus."
    fi
    read -r -p "Profils à activer (séparés par des espaces) [${DEFAULT_PROFILES}] : " REPLY
    local SELECTED
    SELECTED=${REPLY:-$DEFAULT_PROFILES}

    echo "Profils retenus: $SELECTED"

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
