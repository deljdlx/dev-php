# Makefile helpers for Docker dev environment
# Usage examples:
#   make help
#   make up
#   make build
#   make dbash            # open bash as www-data in web container
#   make xon              # enable xdebug (inside container)
#   make xoff             # disable xdebug (inside container)
#   make artisan ARGS="migrate"
#   make composer ARGS="install"
#   make npm ARGS="run dev"
#   make test ARGS="--filter SomeTest"

SHELL := bash
DC := docker compose
WEB := web

.PHONY: help up down restart build pull ps logs logs-web dbash rootbash sh xon xoff artisan composer php npm npx test stan rector phpcs phpcbf phpmetrics fpm-restart logs-clear clean

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"}; /^[a-zA-Z0-9_-]+:.*##/ {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST) | sort

up: ## Start the stack in background
	$(DC) up -d

down: ## Stop and remove the stack
	$(DC) down

restart: ## Restart the web service
	$(DC) restart $(WEB)

build: ## Build (or rebuild) images
	$(DC) build

pull: ## Pull latest images
	$(DC) pull

ps: ## List running containers
	$(DC) ps

logs: ## Tail all services logs
	$(DC) logs -f --tail=200

logs-web: ## Tail web service logs
	$(DC) logs -f --tail=200 $(WEB)

dbash: ## Open an interactive bash as www-data in web
	$(DC) exec -u www-data -it $(WEB) bash

rootbash: ## Open an interactive bash as root in web
	$(DC) exec -u root -it $(WEB) bash

sh: ## Open an interactive sh as www-data in web
	$(DC) exec -u www-data -it $(WEB) sh

xon: ## Enable Xdebug in web (xdebug-on)
	$(DC) exec -u root $(WEB) xdebug-on

xoff: ## Disable Xdebug in web (xdebug-off)
	$(DC) exec -u root $(WEB) xdebug-off

artisan: ## Run Laravel artisan with ARGS="..."
	$(DC) exec -u www-data $(WEB) php artisan $(ARGS)

composer: ## Run composer with ARGS="..."
	$(DC) exec -u www-data $(WEB) composer $(ARGS)

init-laravel: ## launch ./scripts/install-laravel.sh
	bash scripts/install-laravel.sh

php: ## Run php with ARGS="-v" or a script
	$(DC) exec -u www-data $(WEB) php $(ARGS)

npm: ## Run npm with ARGS="install", "run dev", etc.
	$(DC) exec -u www-data $(WEB) npm $(ARGS)

npx: ## Run npx with ARGS="..."
	$(DC) exec -u www-data $(WEB) npx $(ARGS)

test: ## Run PHPUnit with ARGS="..." (defaults to vendor/bin/phpunit)
	$(DC) exec -u www-data $(WEB) bash -lc 'if [ -x vendor/bin/phpunit ]; then vendor/bin/phpunit $(ARGS); else phpunit $(ARGS); fi'

stan: ## Run PHPStan with ARGS="..."
	$(DC) exec -u www-data $(WEB) phpstan $(ARGS)

rector: ## Run Rector with ARGS="..."
	$(DC) exec -u www-data $(WEB) rector $(ARGS)

phpcs: ## Run PHPCS with ARGS="..."
	$(DC) exec -u www-data $(WEB) phpcs $(ARGS)

phpcbf: ## Run PHPCBF with ARGS="..."
	$(DC) exec -u www-data $(WEB) phpcbf $(ARGS)

phpmetrics: ## Run PHP Metrics with ARGS="..."
	$(DC) exec -u www-data $(WEB) phpmetrics $(ARGS)

fpm-restart: ## Restart all installed PHP-FPM services inside web
	$(DC) exec -u root $(WEB) bash -lc 'service php7.4-fpm restart || true; service php8.3-fpm restart || true; service php8.4-fpm restart || true'

logs-clear: ## Clear app logs volume content (LOG_WEB_PATH inside web)
	$(DC) run --rm -u root -e LOG_WEB_PATH $(WEB) bash -lc 'set -e; d="$${LOG_WEB_PATH:-/var/logs/web}"; echo "Clearing $$d"; rm -rf "$$d"/* || true; mkdir -p "$$d"; chown -R www-data:www-data "$$d"'

clean: down ## Stop stack and prune dangling containers/images (CAUTION)
	docker system prune -f
