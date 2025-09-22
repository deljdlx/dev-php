<?php

require_once __DIR__ . '/app/Support/Config.php';
require_once __DIR__ . '/app/Support/Http.php';
require_once __DIR__ . '/app/Docker/DockerClient.php';
require_once __DIR__ . '/app/Docker/ServiceDiscovery.php';

use App\Support\Config;
use App\Support\Http;
use App\Docker\DockerClient;
use App\Docker\ServiceDiscovery;


// file_put_contents('/var/log/app/access.log', date('Y-m-d H:i:s') . " " . ($_SERVER['REMOTE_ADDR'] ?? '-') . " " . ($_SERVER['REQUEST_METHOD'] ?? '-') . " " . ($_SERVER['REQUEST_URI'] ?? '-') . "\n", FILE_APPEND);

$logData = [
	'time' => date('Y-m-d H:i:s'),
	'ip' => $_SERVER['REMOTE_ADDR'] ?? '-',
	'method' => $_SERVER['REQUEST_METHOD'] ?? '-',
	'uri' => $_SERVER['REQUEST_URI'] ?? '-',
	'foo' => 'bar', // Exemple de donnée supplémentaire
];

$jsonLog = json_encode($logData);
file_put_contents('/var/log/app/access.log', $jsonLog . "\n", FILE_APPEND);


function h(?string $s): string { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

$config = new Config();
$dockerApiUrl = $config->dockerApiUrl();
$docker = new DockerClient($config);

$ping = $docker->ping();
$verR = $docker->version();
$pingCode = (int)($ping['code'] ?? 0);
$pingBody = (string)($ping['body'] ?? '');
$pingErr  = isset($ping['error']) ? (string)$ping['error'] : '';
$verCode  = (int)($verR['code'] ?? 0);
$verBody  = (string)($verR['body'] ?? '');
$verErr   = isset($verR['error']) ? (string)$verR['error'] : '';

$statusOk = ($pingCode === 200 && trim((string)$pingBody) === 'OK' && $verCode === 200);
$ver = null;
if ($verCode === 200) {
		$tmp = json_decode((string)$verBody, true);
		if (json_last_error() === JSON_ERROR_NONE) {
				$ver = $tmp;
		}
}

header('Content-Type: text/html; charset=utf-8');
?>

			<?php
				// Charger les options d'affichage
				$svcDisplay = @include __DIR__ . '/config/services.php';
				if (!is_array($svcDisplay)) { $svcDisplay = ['typeOrder' => [], 'typeEmojis' => []]; }
				$typeOrder = isset($svcDisplay['typeOrder']) && is_array($svcDisplay['typeOrder']) ? $svcDisplay['typeOrder'] : [];
				$typeEmojis = isset($svcDisplay['typeEmojis']) && is_array($svcDisplay['typeEmojis']) ? $svcDisplay['typeEmojis'] : [];

				// Découverte dynamique
				$discovery = new ServiceDiscovery($docker);
				$discovered = $discovery->discover();
				$groups = [];
				foreach ($discovered as $svc) {
					$k = isset($svc['type']) ? (string)$svc['type'] : 'Autres';
					if (!isset($groups[$k])) { $groups[$k] = []; }
					$groups[$k][] = $svc;
				}
			?>


<!doctype html>
<html lang="fr">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>PHP ↔ Docker API</title>
	<meta name="robots" content="noindex">
	<meta name="color-scheme" content="light dark">
	<meta name="theme-color" content="#0ea5e9">
	<meta name="x-docker-endpoint" content="<?php echo h($dockerApiUrl); ?>">
	<link rel="stylesheet" href="/assets/css/tokens.css">
	<link rel="stylesheet" href="/assets/css/style.css">
	<script defer src="/assets/js/app.js"></script>
</head>
<body>
	<div class="wrap">

		<header>
			<div class="brand">
				<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path fill="#0ea5e9" d="M74 90h28V62H74zm34 0h28V62h-28zm34 0h28V62h-28zM74 56h28V28H74zm34 0h28V28h-28zm34 0h28V28h-28zM40 128h28v-28H40zm34 0h28v-28H74zm34 0h28v-28h-28zm34 0h28v-28h-28zm34-28v28h28v-28zM34 146c-8 39 22 82 84 82 65 0 98-35 106-62c19 0 28-14 30-22c-6-4-21-7-34 0c-8-19-25-23-33-24v28h-28v-28h-28v28H74v-28H46v28H34z"/></svg>
				<div>
					<div class="title">PHP ↔ Docker API</div>
					<div class="endpoint">Endpoint: <code><?php echo h($dockerApiUrl); ?></code></div>
				</div>
			</div>
			<div class="actions">
				<span class="badge <?php echo $statusOk ? 'ok' : 'fail'; ?>">
					<?php if ($statusOk): ?>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
						Connecté
					<?php else: ?>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fail)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
						Non connecté
					<?php endif; ?>
				</span>
				<a class="btn" href="?t=<?php echo time(); ?>" title="Rafraîchir">Rafraîchir</a>
			</div>
		</header>
			<section class="card" style="margin-bottom:16px">
				<h2>Services rapides</h2>
				<div class="inner">
					<?php foreach ($typeOrder as $type): if (!isset($groups[$type]) || !is_array($groups[$type]) || count($groups[$type]) === 0) continue; ?>
						<h3 class="muted" style="margin:8px 0 6px 0; font-size:14px; text-transform:uppercase; letter-spacing:.02em"><?php echo h($type); ?></h3>
						<div class="kv" style="grid-template-columns:260px 1fr 1fr; gap:10px 14px; margin-bottom:12px">
							<div class="k">Service</div><div class="k">Via Traefik</div><div class="k">Port direct</div>
							<?php foreach ($groups[$type] as $svc): ?>
								<div><?php echo h((isset($typeEmojis[$type]) ? $typeEmojis[$type] . ' ' : '') . $svc['name']); ?></div>
								<div>
									<?php if (!empty($svc['traefik'])): ?>
										<a class="btn" target="_blank" rel="noreferrer noopener" href="<?php echo 'http://' . h($svc['traefik']) . '/'; ?>">http://<?php echo h($svc['traefik']); ?>/</a>
									<?php else: ?>
										<span class="muted">-</span>
									<?php endif; ?>
								</div>
								<div>
									<?php if (!empty($svc['direct'])): ?>
										<?php if (is_string($svc['direct']) && preg_match('~^https?://~i', $svc['direct'])): ?>
											<a class="btn" target="_blank" rel="noreferrer noopener" href="<?php echo h($svc['direct']); ?>"><?php echo h($svc['direct']); ?></a>
										<?php else: ?>
											<code><?php echo h($svc['direct']); ?></code>
										<?php endif; ?>
									<?php elseif (!empty($svc['note'])): ?>
										<span class="muted"><?php echo h($svc['note']); ?></span>
									<?php else: ?>
										<span class="muted">-</span>
									<?php endif; ?>
								</div>
							<?php endforeach; ?>
						</div>
					<?php endforeach; ?>
				</div>
			</section>
				<?php
					$endpoints = [
						'/_ping' => '/_ping',
						'/version' => '/version',
						'/info' => '/info',
						'/containers/json?all=1' => '/containers/json?all=1',
						'/images/json' => '/images/json',
						'/networks' => '/networks',
						'/volumes' => '/volumes',
						'custom' => 'Personnalisé…',
					];
					$sel = isset($_GET['ep']) ? (string)$_GET['ep'] : '';
					$custom = isset($_GET['custom']) ? (string)$_GET['custom'] : '';
					$doExplore = isset($_GET['go']) || isset($_GET['ep']) || isset($_GET['custom']);
					$chosen = $sel && $sel !== 'custom' ? $sel : ($custom ?: '');
					$chosenPath = $chosen !== '' ? DockerClient::sanitizePath($chosen) : '';
					$explore = null;
					if ($doExplore && $chosenPath !== '') {
						$explore = Http::get(rtrim($dockerApiUrl, '/') . $chosenPath);
						$explore['pretty'] = null;
						if (is_string($explore['body'])) {
							$json = json_decode($explore['body'], true);
							if (json_last_error() === JSON_ERROR_NONE) {
								$explore['pretty'] = json_encode($json, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);
							}
						}
					}
				?>

				<section class="card" style="margin-bottom:16px">
					<h2>Explorer un endpoint</h2>
					<div class="inner">
						<form class="explorer" method="get" action="">
							<label for="ep" class="muted">Endpoint</label>
							<select id="ep" name="ep">
								<?php foreach ($endpoints as $value => $label): ?>
									<option value="<?php echo h($value); ?>" <?php echo ($sel === $value ? 'selected' : ''); ?>><?php echo h($label); ?></option>
								<?php endforeach; ?>
							</select>
							<input type="text" name="custom" placeholder="/path?query=…" value="<?php echo h($custom); ?>" aria-label="Endpoint personnalisé" />
							<input type="hidden" name="go" value="1" />
							<button type="submit">Interroger</button>
						</form>
						<?php if ($doExplore && $chosenPath === ''): ?>
							<p class="muted">Choisissez un endpoint ou saisissez un chemin personnalisé.</p>
						<?php elseif ($explore): ?>
							<div class="kv" style="margin-bottom:12px">
								<div class="k">Requête</div><div><code>GET <?php echo h($chosenPath); ?></code></div>
								<div class="k">HTTP</div><div><?php echo (int)$explore['code']; ?></div>
								<div class="k">Type</div><div><?php echo h($explore['ctype'] ?? ''); ?></div>
							</div>
							<?php if (!empty($explore['error'])): ?>
								<p style="color:var(--fail)">Erreur cURL: <?php echo h($explore['error']); ?></p>
							<?php endif; ?>
							<details open>
								<summary>Réponse</summary>
								<pre><?php echo h($explore['pretty'] ?? (string)$explore['body']); ?></pre>
							</details>
						<?php endif; ?>
					</div>
				</section>

		<div class="grid">
			<section class="card">
				<h2>/_ping</h2>
				<div class="inner">
					<p class="muted">HTTP: <?php echo (int)$pingCode; ?></p>
					<?php if ($pingErr): ?><p style="color:var(--fail)">Erreur cURL: <?php echo h($pingErr); ?></p><?php endif; ?>
					<pre><?php echo h((string)$pingBody); ?></pre>
				</div>
			</section>

			<section class="card">
				<h2>/version</h2>
				<div class="inner">
					<p class="muted">HTTP: <?php echo (int)$verCode; ?></p>
					<?php if ($ver && is_array($ver)): ?>
						<div class="kv">
							<div class="k">Version</div><div><?php echo h($ver['Version'] ?? '-'); ?></div>
							<div class="k">API</div><div><?php echo h($ver['ApiVersion'] ?? '-'); ?></div>
							<div class="k">Go</div><div><?php echo h($ver['GoVersion'] ?? '-'); ?></div>
							<div class="k">Git</div><div><?php echo h($ver['GitCommit'] ?? '-'); ?></div>
							<div class="k">OS</div><div><?php echo h($ver['Os'] ?? '-'); ?></div>
							<div class="k">Arch</div><div><?php echo h($ver['Arch'] ?? '-'); ?></div>
							<div class="k">BuildTime</div><div><?php echo h($ver['BuildTime'] ?? '-'); ?></div>
						</div>
						<details>
							<summary>JSON brut</summary>
							<pre><?php echo h($verBody ?: ''); ?></pre>
						</details>
					<?php else: ?>
						<?php if ($verErr): ?><p style="color:var(--fail)">Erreur cURL: <?php echo h($verErr); ?></p><?php endif; ?>
						<pre><?php echo h($verBody ?: ''); ?></pre>
					<?php endif; ?>
				</div>
			</section>
		</div>

		<details>
			<summary>phpinfo()</summary>
			<?php phpinfo(); ?>
		</details>
	</div>
</body>
</html>