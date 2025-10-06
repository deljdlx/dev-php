<?php

declare(strict_types=1);

use Rector\Config\RectorConfig;
use Rector\Set\ValueObject\LevelSetList;

return static function (RectorConfig $rectorConfig): void {
    $rectorConfig->paths([
        '/var/www/html/features',
    ]);
    // ignore vendor
    $rectorConfig->skip([
        __DIR__ . '/vendor',
    ]);

    $rectorConfig->sets([
        LevelSetList::UP_TO_PHP_73,
    ]);
};
