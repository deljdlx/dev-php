#!/usr/bin/env bash
# Utilities for launch.sh: logging, formatting, environment checks, docker helpers

# Do not use 'set -e' in libraries; let the caller control error handling

# --- Logging with levels, colors, and emojis ---
: "${LOG_LEVEL:=INFO}"

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

# --- Visual helpers for big sections ---
term_width() { command -v tput >/dev/null 2>&1 && tput cols || echo 80; }
hr() {
    local ch width line
    ch=${1:-"─"}
    width=$(term_width)
    line=$(printf "%${width}s" "" | tr ' ' "$ch")
    printf "%b%b%s%b\n" "$CLR_BOLD" "$CLR_BLUE" "$line" "$CLR_RESET"
}
section() {
    local title emoji
    title="$1"; emoji="${2:-}";
    echo
    hr
    if [ -n "$emoji" ]; then
        printf "%b%s %s%b\n" "$CLR_BOLD" "$emoji" "$title" "$CLR_RESET"
    else
        bold "$title"
    fi
    hr
}

command_exists() { command -v "$1" >/dev/null 2>&1; }

# Read a meminfo field value in kB
meminfo_kb() {
    local KEY=$1
    awk -v k="$KEY" '$1==k":" {print $2; found=1} END{ if(!found) print 0 }' /proc/meminfo 2>/dev/null || echo 0
}

check_ram() {
    info "Vérification de la mémoire RAM"
    if [ ! -r /proc/meminfo ]; then
        warn "/proc/meminfo non accessible; impossible d'évaluer la RAM."
        return 0
    fi

    local total_kb avail_kb total_mb avail_mb
    total_kb=$(meminfo_kb MemTotal)
    avail_kb=$(meminfo_kb MemAvailable)

    if [ "${avail_kb:-0}" -eq 0 ]; then
        local free_kb buff_kb cached_kb
        free_kb=$(meminfo_kb MemFree)
        buff_kb=$(meminfo_kb Buffers)
        cached_kb=$(meminfo_kb Cached)
        avail_kb=$(( free_kb + buff_kb + cached_kb ))
    fi

    total_mb=$(( total_kb / 1024 ))
    avail_mb=$(( avail_kb / 1024 ))

    local min_total_mb=4096
    local min_avail_mb=1536

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

# --- Contextual help ---
show_help() {
    local topic=${1:-}
    echo
    section "Aide — $topic" "🆘"
    case "$topic" in
        ports)
            cat <<'HLP'
Pourquoi ça bloque ?
- Un ou plusieurs ports (par ex. 80, 1025, 8025, 5601, …) sont déjà utilisés par une autre application sur votre machine.
- Deux services ne peuvent pas écouter le même port en même temps.

Comment identifier le programme qui utilise un port ?
- Linux (nécessite parfois sudo):
  - ss : sudo ss -ltnp | grep ':80'
  - lsof: sudo lsof -iTCP:80 -sTCP:LISTEN -n -P

Que faire ensuite ?
1) Libérer le port en arrêtant l'application qui l'occupe (ex: un ancien container, Apache/Nginx local, Mailhog, …).
2) Ou bien changer le port dans le fichier .env (ex: TRAEFIK_HTTP_PORT=8088), puis relancer.
3) Vous pouvez aussi continuer, mais le lancement échouera pour les services en conflit.

Liens utiles:
- Ports et réseau Docker: https://docs.docker.com/config/containers/container-networking/
- Variables d'environnement et .env: https://docs.docker.com/compose/environment-variables/envvars/
HLP
            ;;
        running_services)
            cat <<'HLP'
Pourquoi ça bloque ?
- Des services de CE projet tournent déjà (docker compose ps). Relancer sans les arrêter peut créer des conflits ou garder un état ancien.

Que faire ?
1) Arrêter proprement les services du projet: docker compose down --remove-orphans
2) Continuer sans arrêter est possible, mais vous pourriez garder l'état actuel (conteneurs/ports/volumes) et rencontrer des erreurs.

Liens utiles:
- docker compose ps: https://docs.docker.com/reference/cli/docker/compose/ps/
- docker compose down: https://docs.docker.com/reference/cli/docker/compose/down/
HLP
            ;;
        env_missing)
            cat <<'HLP'
Pourquoi ça bloque ?
- Le fichier .env n'existe pas encore. Il contient vos ports, mots de passe, et options de la stack.

Que faire ?
1) Créer .env à partir de .env.example (recommandé). Vous pourrez ensuite ajuster les valeurs.
2) Sinon, créez-le manuellement en vous inspirant de .env.example.

Liens utiles:
- .env et variables d'environnement: https://docs.docker.com/compose/environment-variables/envvars/
HLP
            ;;
        docker_daemon)
            cat <<'HLP'
Pourquoi ça bloque ?
- Le démon Docker ne répond pas. Sans lui, aucune commande docker ne peut fonctionner.

Que faire ?
1) Démarrer le service Docker (Linux): sudo systemctl start docker
2) Vérifier l'accès sans sudo (groupe docker): https://docs.docker.com/engine/install/linux-postinstall/
3) Réessayer: docker info

Installer Docker:
- Guide d'installation Linux: https://docs.docker.com/engine/install/
HLP
            ;;
        compose_missing)
            cat <<'HLP'
Pourquoi ça bloque ?
- Le plugin Docker Compose V2 n'est pas disponible (commande 'docker compose').

Que faire ?
1) Installer Docker Compose V2: https://docs.docker.com/compose/install/linux/
2) Vérifier ensuite: docker compose version
HLP
            ;;
        compose_invalid)
            cat <<'HLP'
Pourquoi ça bloque ?
- Le fichier docker-compose.yml contient une erreur de syntaxe ou d'options.

Que faire ?
1) Valider et voir les erreurs: docker compose config
2) Corriger la configuration à l'endroit pointé par l'erreur.

Référence:
- Spécification Compose: https://docs.docker.com/compose/compose-file/
HLP
            ;;
        *)
            echo "Aide non définie pour: $topic";
            ;;
    esac
}

# Ensure .env exists or offer to create it from .env.example
ensure_env() {
    if [ ! -f ./.env ]; then
        warn "Fichier .env introuvable à la racine du projet."
        if [ -f ./.env.example ]; then
            read -r -p "Créer .env à partir de .env.example ? [Y/n] (h pour aide) " REPLY
            REPLY=${REPLY:-Y}
            case "${REPLY,,}" in
                y|yes)
                    cp ./.env.example ./.env
                    ok ".env créé depuis .env.example."
                    ;;
                h|a|help)
                    show_help env_missing
                    ensure_env
                    ;;
                *)
                    err "Création de .env annulée. Veuillez créer .env (copie de .env.example) puis relancer."
                    exit 1
                    ;;
            esac
        else
            err "Aucun .env.example trouvé. Veuillez ajouter .env.example au dépôt, puis relancer."
            show_help env_missing
            exit 1
        fi
    fi
}

load_env() {
    if [ -f ./.env ]; then
        # shellcheck disable=SC1091
        set -a; . ./.env; set +a
        ok ".env chargé."
    else
        warn "Aucun .env à charger."
    fi
}

check_docker() {
    info "Vérification de l'environnement Docker"
    if ! command_exists docker; then
        err "Docker n'est pas installé ou introuvable dans le PATH."
        show_help docker_daemon
        exit 1
    fi
    if ! docker info >/dev/null 2>&1; then
        err "Docker daemon indisponible. Démarrez Docker puis réessayez."
        show_help docker_daemon
        exit 1
    fi
    ok "Docker opérationnel."

    if ! docker compose version >/dev/null 2>&1; then
        err "Plugin Docker Compose V2 indisponible (commande 'docker compose')."
        show_help compose_missing
        exit 1
    fi
    ok "Docker Compose V2 disponible."

    if ! docker compose config -q; then
        err "docker-compose.yml invalide. Corrigez la configuration."
        show_help compose_invalid
        exit 1
    fi
    ok "docker-compose.yml valide."

    if [ -S /var/run/docker.sock ]; then
        ok "docker.sock accessible."
    else
        warn "docker.sock introuvable; certains services (traefik, filebeat) peuvent échouer."
    fi

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
    ss -ltn 2>/dev/null | awk '{print $4}' | grep -E "(^|:)${PORT}$" >/dev/null 2>&1
}

check_ports() {
    section "Vérification des ports d'écoute sur l'hôte" "🧩"
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
        while true; do
            warn "Ports déjà utilisés: ${CONFLICTS[*]}"
            echo "Options:"
            echo "  [K] Kill & relancer la stack docker compose du projet"
            echo "  [C] Continuer malgré tout (risque d'échec au lancement)"
            echo "  [S] Stopper (défaut)"
            echo "  [H] Aide (que faire ?)"
            read -r -p "Votre choix [k/C/s/h]: " ACTION
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
                    break
                    ;;
                h|a|help|\?)
                    show_help ports
                    ;;
                *)
                    err "Arrêt suite aux conflits de ports. Modifiez votre .env ou libérez les ports, puis relancez."
                    exit 1
                    ;;
            esac
        done
    else
        ok "Aucun conflit de ports détecté."
    fi
}

# ---- Runtime preflight helpers ----
compose_ps() { docker compose ps 2>/dev/null || true; }
get_running_services() { compose_ps | awk 'NR>1 && $0 ~ /\bUp\b/ {print $1}'; }
print_services_status() { local o; o=$(compose_ps); [ -n "$o" ] && echo "$o" || echo "(aucune sortie)"; }

prompt_stop_running() {
    while true; do
        read -r -p "Voulez-vous arrêter les services en cours avant relance ? [Y/n] (h pour aide) " ans
        ans=${ans:-Y}
        case "${ans,,}" in
            y|yes) return 0 ;;
            n|no)  return 1 ;;
            h|a|help|\?) show_help running_services ;;
            *) echo "Réponse invalide. Tapez Y, n, ou h." ;;
        esac
    done
}

stop_running_services() { docker compose down --remove-orphans; }

runtime_preflight() {
    section "Runtime preflight — état des services du projet" "🚦"
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
            while true; do
                read -r -p "Souhaitez-vous continuer malgré tout ? [y/N] (h pour aide) " cont
                cont=${cont:-N}
                case "${cont,,}" in
                    y|yes) break ;;
                    n|no)
                        err "Arrêt demandé par l'utilisateur."
                        exit 1
                        ;;
                    h|a|help|\?) show_help running_services ;;
                    *) echo "Réponse invalide. Tapez y, N, ou h." ;;
                esac
            done
        fi
    else
        ok "Aucun service du projet n'est en cours d'exécution."
    fi
}

# High-level preflight orchestrating env and docker checks
preflight() {
    section "Préflight système" "🔎"
    ensure_env
    load_env
    check_docker
    check_ram
    ok "Préflight terminé."
}
