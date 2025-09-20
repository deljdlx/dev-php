<?php

namespace App\Docker;

use App\Support\Config;
use App\Support\Http;

final class DockerClient
{
    private string $base;

    public function __construct(Config $config)
    {
        $this->base = rtrim($config->dockerApiUrl(), '/');
    }

    /** Sanitize a provided path or absolute URL into a path starting with '/' */
    public static function sanitizePath(string $path): string
    {
        $p = trim($path);
        if ($p === '') return '/_ping';
        if (preg_match('~^https?://~i', $p)) {
            $u = parse_url($p);
            $p = ($u['path'] ?? '/');
            if (!empty($u['query'])) $p .= '?' . $u['query'];
        }
        if ($p[0] !== '/') $p = '/' . $p;
        return $p;
    }

    public function ping(): array { return Http::get($this->base . '/_ping', 2, 4); }
    public function version(): array { return Http::get($this->base . '/version', 2, 4); }
    public function info(): array { return Http::get($this->base . '/info', 2, 4); }

    public function get(string $path): array
    {
        return Http::get($this->base . self::sanitizePath($path));
    }
}
