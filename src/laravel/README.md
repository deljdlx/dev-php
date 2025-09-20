# Laravel + Filament — Guide d'installation (dev)

Ce dossier contient une application Laravel (avec Filament) prévue pour tourner dans le conteneur `web` de ce dépôt.

## Aperçu

- URL app: http://web.localhost/
- URL admin (Filament): http://web.localhost/admin
- Chemin projet: `src/laravel`

Identifiants seedés (par défaut):
- Email: `admin@example.com`
- Mot de passe: `password`

## 1) Démarrer l'environnement Docker

Dans la racine du dépôt:

```bash
docker compose up -d db elasticsearch kibana web
```

Attendez quelques secondes que les services soient prêts.

Astuce (tout-en-un):

```bash
./scripts/install-laravel.sh
```
Vous pouvez forcer l'URL: `APP_URL=http://web.localhost ./scripts/install-laravel.sh`.

## 2) Configuration Laravel (.env)

Copiez le fichier d'exemple et adaptez les variables clés:

```bash
docker compose exec -u www-data web bash -lc 'cd /var/www/html/laravel && [ -f .env ] || cp .env.example .env'
```

Valeurs recommandées dans `.env`:

```env
APP_NAME="Laravel"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://web.localhost

LOG_CHANNEL=stack

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=myurgo
DB_USERNAME=root
DB_PASSWORD=rootpass

CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
```

## 3) Dépendances PHP et clé d'app

Selon l'état du vendor, vous pouvez relancer l'install composer et générer la clé:

```bash
docker compose exec -u www-data web bash -lc '
	cd /var/www/html/laravel && \
	composer install --no-interaction && \
	php artisan key:generate
' 
```

## 4) Migrations + seed

Appliquez la base et les données de démo (incluant l'admin Filament par défaut):

```bash
docker compose exec -u www-data web bash -lc '
	cd /var/www/html/laravel && \
	php artisan migrate --force && \
	php artisan db:seed --force
'
```

Si besoin, vous pouvez créer un utilisateur admin Filament manuellement:

```bash
docker compose exec -u www-data web bash -lc '
	cd /var/www/html/laravel && php artisan make:filament-user
'
```

## 5) Liens de stockage

```bash
docker compose exec -u www-data web bash -lc 'cd /var/www/html/laravel && php artisan storage:link || true'
```

## 6) Assets front (Vite) — optionnel

Si vous voulez recompiler les assets, exécutez Node sur votre hôte (ou un conteneur Node séparé):

```bash
cd src/laravel
npm ci
npm run build   # ou: npm run dev
```

L'app fonctionne même sans recompiler si les assets fournis suffisent pour le dev.

## 7) Accès et vérifications

- App: http://web.localhost/
- Admin: http://web.localhost/admin

Connectez-vous avec `admin@example.com` / `password` (si seed exécuté) ou le compte créé via `make:filament-user`.

## Commandes utiles

- Ouvrir un shell dans le conteneur web en tant que www-data:

```bash
docker compose exec -u www-data web bash
```

- Artisan rapide:

```bash
docker compose exec -u www-data web bash -lc 'cd /var/www/html/laravel && php artisan about'
```

- Exécuter les tests:

```bash
docker compose exec -u www-data web bash -lc 'cd /var/www/html/laravel && php artisan test'
```

## Dépannage

- 404 sur les assets (CSS/JS):
	- Assurez-vous d'utiliser les URLs sans `/laravel/public` (la racine Apache pointe déjà sur `laravel/public`).
	- Vérifiez `APP_URL=http://web.localhost` dans `.env` puis videz le cache: `php artisan config:clear`.
	- Forcer un rechargement du navigateur (Ctrl+F5).

- Erreur DB: vérifiez `.env` (DB_HOST=db, identifiants) et que le service `db` est en marche.

- Droits/écriture: les dossiers `storage/` et `bootstrap/cache/` doivent être accessibles par www-data. Dans le conteneur:

```bash
docker compose exec web bash -lc 'cd /var/www/html/laravel && chown -R www-data:www-data storage bootstrap/cache'
```

- Rebuilder la conf Apache si vous modifiez `/docker/apache/dev.conf`:

```bash
docker compose build web --no-cache && docker compose up -d web
```

---

Si quelque chose manque dans ce guide, ouvrez une PR pour l'améliorer.
