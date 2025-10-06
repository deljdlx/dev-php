# Docker PHP + MariaDB + Elasticsearch + Kibana

This stack adds Elasticsearch and Kibana so your PHP app can log directly to Elasticsearch and visualize in Kibana.


## Services
- PHP (web-php8) on http://localhost:8080
- MariaDB (db) on localhost:3306
- Elasticsearch (single-node) on http://localhost:9200
- Kibana on http://localhost:5601

Security is disabled on Elasticsearch for local development only. Do not use this configuration in production.

## Prerequisites (Linux)
Elasticsearch requires increasing `vm.max_map_count` on the host:

```bash
sudo sysctl -w vm.max_map_count=262144
```

To persist across reboots:

```bash
echo 'vm.max_map_count=262144' | sudo tee /etc/sysctl.d/99-elasticsearch.conf
sudo sysctl --system
```

## Start the stack

```bash
docker compose up -d db elasticsearch kibana web-php8
```

Check health:

```bash
curl -s http://localhost:9200 | jq .
open http://localhost:5601
```

## PHP ➜ Elasticsearch logging
The PHP container has `ELASTICSEARCH_URL=http://elasticsearch:9200` set. Inside PHP, you can use Monolog's ElasticsearchHandler.

Install dependencies in your app (mounted at `../urgo`):

```bash
# from inside the PHP container or host with PHP/composer available
composer require monolog/monolog:^2.9 elasticsearch/elasticsearch:^7.17
```

Minimal example:

```php
<?php
use Monolog\\Logger;
use Monolog\\Handler\\ElasticsearchHandler;
use Elasticsearch\\ClientBuilder;

$client = ClientBuilder::create()
    ->setHosts([getenv('ELASTICSEARCH_URL') ?: 'http://elasticsearch:9200'])
    ->build();

$logger = new Logger('app');
$handler = new ElasticsearchHandler($client, [
    'index' => 'app-logs-' . date('Y.m.d'),
    'type'  => '_doc', // ES7 compatibility
]);
$logger->pushHandler($handler);

$logger->info('Hello from PHP to Elasticsearch', ['user' => 123, 'feature' => 'logging']);
```

You should see documents in the `app-logs-*` indices. In Kibana, create a data view for `app-logs-*` and explore logs.

## Notes
- `depends_on` does not wait for services to be "ready"; if your app starts before Elasticsearch is up, add a simple retry in your bootstrap or use a healthcheck/wait script.
- Java heap is set to 512m for Elasticsearch via `ES_JAVA_OPTS`. Increase if needed.
- Data is persisted under the `es_data` Docker volume.

## Laravel + Filament demo

- App path: `src/laravel`
- URL: http://web.localhost/
- Filament admin: http://web.localhost/admin

Seeded login:
- Email: admin@example.com
- Password: password

Run artisan inside the container:

```bash
docker compose exec -u www-data web bash -lc 'cd /var/www/html/laravel && php artisan migrate'
```
# dev-php
