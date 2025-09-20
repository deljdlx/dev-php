<?php

namespace App\Docker;

use App\Support\Http;

/**
 * Dynamically discovers services from Docker containers using the Docker API.
 * Produces entries compatible with the UI: type, name, traefik host, direct URL, note.
 * PHP 7.3 compatible (no typed props).
 */
final class ServiceDiscovery
{
    /** @var DockerClient */
    private $docker;
    /** @var array */
    private $opts;

    /**
     * @param array $opts optional tuning:
     *   - httpPorts: int[]
     *   - httpsPorts: int[]
     *   - nonHttpPorts: array<int,string> map port=>scheme (e.g. 3306=>"tcp", 1025=>"smtp")
     *   - prettyNames: array<string,string> map substring=>Pretty Name (matches against image or name)
     */
    public function __construct(DockerClient $docker, array $opts = [])
    {
        $this->docker = $docker;
        $this->opts = $opts;
        // defaults
        if (!isset($this->opts['httpPorts'])) $this->opts['httpPorts'] = [80, 8080, 8081, 5601, 8025, 19999, 9000, 8200, 9200];
        if (!isset($this->opts['httpsPorts'])) $this->opts['httpsPorts'] = [443];
        if (!isset($this->opts['nonHttpPorts'])) $this->opts['nonHttpPorts'] = [3306 => 'tcp', 1025 => 'smtp'];
        if (!isset($this->opts['prettyNames'])) {
            $this->opts['prettyNames'] = [
                'traefik' => 'Traefik (Dashboard)',
                'mailhog' => 'Mailhog (UI)',
                'netdata' => 'Netdata',
                'kibana' => 'Kibana',
                'elasticsearch' => 'Elasticsearch',
                'apm-server' => 'APM Server',
                'portainer' => 'Portainer',
                'nocodb' => 'NocoDB',
                'mariadb' => 'MariaDB',
                'db' => 'MariaDB',
                'web' => 'App web',
                'docker-socket-proxy' => 'Docker API (interne réseau)',
            ];
        }
    }

    /**
     * @return array<int,array{type:string,name:string,traefik:?string,direct:?string,note?:string}>
     */
    public function discover(): array
    {
        $resp = $this->docker->get('/containers/json'); // running only
        $list = [];
        if ((int)($resp['code'] ?? 0) !== 200) {
            return $list;
        }
        $json = json_decode((string)($resp['body'] ?? ''), true);
        if (!is_array($json)) {
            return $list;
        }

        foreach ($json as $c) {
            $name = $this->containerName($c);
            $image = isset($c['Image']) ? (string)$c['Image'] : '';
            $labels = isset($c['Labels']) && is_array($c['Labels']) ? $c['Labels'] : [];
            $ports  = isset($c['Ports']) && is_array($c['Ports']) ? $c['Ports'] : [];

            $pretty = $this->prettyName($name, $image);
            $type   = $this->categorize($name, $image, $ports, $labels);
            $traefikHost = $this->detectTraefikHost($labels);
            $direct = $this->detectDirectUrl($ports);
            $note = null;

            // Special case: docker-socket-proxy is internal-only
            if (stripos($name, 'docker-socket-proxy') !== false || stripos($image, 'docker-socket-proxy') !== false) {
                $direct = null;
                $note = 'http://docker-socket-proxy:2375 (depuis les conteneurs)';
                if ($type === '') $type = 'APIs / Système';
            }

            $list[] = [
                'type' => $type !== '' ? $type : 'Interfaces Web',
                'name' => $pretty,
                'traefik' => $traefikHost,
                'direct' => $direct,
                'note' => $note,
            ];
        }

        return $this->stableSort($list);
    }

    private function containerName(array $c): string
    {
        if (!empty($c['Names']) && is_array($c['Names'])) {
            $n = (string)$c['Names'][0];
            return ltrim($n, '/');
        }
        if (!empty($c['Id'])) return substr((string)$c['Id'], 0, 12);
        return 'container';
    }

    private function prettyName(string $name, string $image): string
    {
        foreach ($this->opts['prettyNames'] as $needle => $label) {
            if (stripos($name, $needle) !== false || stripos($image, $needle) !== false) {
                return $label;
            }
        }
        // Fallback to Compose service name if present
        $clean = preg_replace('~^.+?_~', '', $name); // drop project prefix if any
        return $clean ?: $name;
    }

    private function categorize(string $name, string $image, array $ports, array $labels): string
    {
        $n = strtolower($name . ' ' . $image);
        if (strpos($n, 'mariadb') !== false || $this->hasPort($ports, 3306)) return 'Bases de données / Protocoles';
        if (strpos($n, 'smtp') !== false || $this->hasPort($ports, 1025)) return 'Bases de données / Protocoles';
        if (strpos($n, 'elasticsearch') !== false || strpos($n, 'apm-server') !== false) return 'APIs / Système';
        if (strpos($n, 'docker-socket-proxy') !== false) return 'APIs / Système';
        return 'Interfaces Web';
    }

    private function hasPort(array $ports, int $p): bool
    {
        foreach ($ports as $port) {
            if ((int)($port['PrivatePort'] ?? 0) === $p || (int)($port['PublicPort'] ?? 0) === $p) return true;
        }
        return false;
    }

    private function detectTraefikHost(array $labels): ?string
    {
        foreach ($labels as $k => $v) {
            if (!is_string($k) || !is_string($v)) continue;
            if (preg_match('~^traefik\.http\.routers\.[^.]+\.rule$~', $k)) {
                if (preg_match('~Host\(`([^`]+)`\)~', $v, $m)) {
                    return $m[1];
                }
            }
        }
        return null;
    }

    private function detectDirectUrl(array $ports): ?string
    {
        // Prefer published HTTP(S) ports; fall back to non-HTTP schemes.
        $best = null; $bestWeight = -1; $scheme = 'http';
        foreach ($ports as $p) {
            $pub = (int)($p['PublicPort'] ?? 0);
            $type = strtolower((string)($p['Type'] ?? ''));
            if ($pub <= 0 || $type !== 'tcp') continue;
            $w = $this->portWeight($pub);
            if ($w > $bestWeight) { $best = $pub; $bestWeight = $w; }
        }
        if ($best !== null) {
            $port = (int)$best;
            if (in_array($port, $this->opts['httpsPorts'], true)) return 'https://localhost:' . $port . '/';
            if (isset($this->opts['nonHttpPorts'][$port])) return $this->opts['nonHttpPorts'][$port] . '://localhost:' . $port;
            if (in_array($port, $this->opts['httpPorts'], true)) return 'http://localhost:' . $port . '/';
            // Default to http if unknown but TCP
            return 'http://localhost:' . $port . '/';
        }
        return null;
    }

    private function portWeight(int $port): int
    {
        // Higher weight = more likely to be a nice UI port
        $priority = [80 => 100, 443 => 95, 8080 => 90, 8081 => 85, 5601 => 80, 8025 => 75, 19999 => 70, 9000 => 65, 8200 => 60, 9200 => 55];
        if (isset($priority[$port])) return $priority[$port];
        if (isset($this->opts['nonHttpPorts'][$port])) return 10; // low priority for non-http
        return 20; // default
    }

    private function stableSort(array $list): array
    {
        // Keep order roughly by type then name for a predictable UI
        usort($list, function ($a, $b) {
            $ta = (string)($a['type'] ?? '');
            $tb = (string)($b['type'] ?? '');
            if ($ta === $tb) return strcasecmp((string)$a['name'], (string)$b['name']);
            $order = ['Interfaces Web', 'APIs / Système', 'Bases de données / Protocoles'];
            $ia = array_search($ta, $order, true); if ($ia === false) $ia = 999;
            $ib = array_search($tb, $order, true); if ($ib === false) $ib = 999;
            return $ia <=> $ib;
        });
        return $list;
    }
}
