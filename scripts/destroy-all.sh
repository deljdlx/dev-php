#!/usr/bin/env bash

# Destroys all containers, networks, and images associated with THIS stack,
# plus the named volumes declared in docker-compose.yml. Leaves the rest of your
# system alone (unless you opt-in to extra pruning flags).
#
# Usage:
#   ./scripts/destroy-all.sh            # interactive confirm
#   ./scripts/destroy-all.sh -y         # no prompt
#   ./scripts/destroy-all.sh -y --prune-build   # also prune build cache
#   ./scripts/destroy-all.sh -y --prune-system  # DANGER: global prune (-a, --volumes)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "[error] docker not found in PATH" >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "[error] docker compose (v2) not available" >&2
  exit 1
fi
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "[error] compose file not found: $COMPOSE_FILE" >&2
  exit 1
fi

YES=false
PRUNE_BUILD=false
PRUNE_SYSTEM=false

while (( "$#" )); do
  case "$1" in
    -y|--yes) YES=true ;;
    --prune-build) PRUNE_BUILD=true ;;
    --prune-system) PRUNE_SYSTEM=true ;;
    -h|--help)
      sed -n '1,40p' "$0" | sed -n '1,25p'
      exit 0
      ;;
    *)
      echo "[warn] unknown arg: $1" >&2
      ;;
  esac
  shift || true
done

cd "$REPO_ROOT"

PROJECT_NAME=$(basename "$REPO_ROOT")
echo "[info] Project: $PROJECT_NAME"
echo "[info] Compose file: $COMPOSE_FILE"

echo "[plan] This will run: docker compose -f docker-compose.yml down -v --rmi all --remove-orphans"
echo "       It removes: containers, networks, images used by services, and declared volumes of THIS stack."

if [ "$PRUNE_BUILD" = true ]; then
  echo "[plan] Additionally: docker builder prune -f (build cache)"
fi
if [ "$PRUNE_SYSTEM" = true ]; then
  echo "[plan] DANGER: docker system prune -a --volumes -f (GLOBAL)"
fi

if [ "$YES" != true ]; then
  read -r -p "Proceed? (y/N) " ans
  case "$ans" in
    y|Y|yes|YES) ;;
    *) echo "Aborted."; exit 0 ;;
  esac
fi

set -x
docker compose -f "$COMPOSE_FILE" down -v --rmi all --remove-orphans || true
set +x

if [ "$PRUNE_BUILD" = true ]; then
  set -x
  docker builder prune -f || true
  set +x
fi

if [ "$PRUNE_SYSTEM" = true ]; then
  echo "[warn] Executing GLOBAL prune in 5 seconds… Press Ctrl+C to cancel."
  sleep 5
  set -x
  docker system prune -a --volumes -f || true
  set +x
fi

echo "[done] Stack resources removed. You now have a clean slate for this project."
