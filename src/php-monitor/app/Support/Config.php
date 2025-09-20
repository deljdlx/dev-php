<?php

namespace App\Support;

final class Config
{
    /** @var string */
    private $dockerApiUrl;

    public function __construct()
    {
        $env = getenv('DOCKER_API_URL');
        $this->dockerApiUrl = $env && is_string($env) && $env !== '' ? $env : 'http://docker-socket-proxy:2375';
    }

    public function dockerApiUrl(): string
    {
        return $this->dockerApiUrl;
    }
}
