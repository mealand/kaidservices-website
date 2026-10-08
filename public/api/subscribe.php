<?php
/**
 * Kaid Services — launch-list signup endpoint.
 *
 * Stores emails in a CSV *outside* the public web root and emails a notification.
 * Responds with JSON to fetch() requests, or redirects back for plain form posts.
 */
declare(strict_types=1);

$config = [
    // Where new-signup notifications are sent.
    'notify_to'    => 'info@kaidservices.com',
    // Must be an address on the hosting domain or mail may be rejected.
    'notify_from'  => 'no-reply@kaidservices.com',
    // ~/kaid-private (one level above public_html) — never web-accessible.
    'storage_dir'  => dirname(__DIR__, 2) . '/kaid-private',
    // Per-IP submissions allowed per hour.
    'rate_limit'   => 5,
];

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(bool $ok, string $message, int $status, bool $json): void
{
    if (!$json) {
        header('Location: /?subscribed=' . ($ok ? '1' : '0') . '#notify', true, 303);
        exit;
    }
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['ok' => $ok, 'message' => $message]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 'Method not allowed.', 405, true);
}

// Honeypot: bots fill every field. Pretend success.
if (!empty($_POST['company_website'] ?? '')) {
    respond(true, "You're on the list.", 200, $wantsJson);
}

$email = trim((string) ($_POST['email'] ?? ''));
if ($email === '' || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Please enter a valid email address.', 422, $wantsJson);
}
$email = strtolower($email);

// Storage
$dir = $config['storage_dir'];
if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
    error_log('[subscribe] Cannot create storage dir: ' . $dir);
    respond(false, 'Signup is temporarily unavailable. Please email us instead.', 500, $wantsJson);
}

// Simple per-IP rate limit
$ipHash   = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . __FILE__);
$rateFile = $dir . '/rate_' . substr($ipHash, 0, 16) . '.json';
$now      = time();
$hits     = is_file($rateFile) ? (json_decode((string) file_get_contents($rateFile), true) ?: []) : [];
$hits     = array_values(array_filter($hits, static fn ($t) => $t > $now - 3600));
if (count($hits) >= $config['rate_limit']) {
    respond(false, 'Too many attempts. Please try again later.', 429, $wantsJson);
}
$hits[] = $now;
file_put_contents($rateFile, json_encode($hits), LOCK_EX);

// Append if new
$csv = $dir . '/subscribers.csv';
$fh  = fopen($csv, 'c+');
if ($fh === false) {
    respond(false, 'Signup is temporarily unavailable. Please email us instead.', 500, $wantsJson);
}
flock($fh, LOCK_EX);
$exists = false;
while (($row = fgetcsv($fh, 0, ',', '"', '\\')) !== false) {
    if (isset($row[0]) && $row[0] === $email) {
        $exists = true;
        break;
    }
}
if (!$exists) {
    fseek($fh, 0, SEEK_END);
    fputcsv($fh, [$email, gmdate('c')], ',', '"', '\\');
}
flock($fh, LOCK_UN);
fclose($fh);

if ($exists) {
    respond(true, "You're already on the list — see you at launch.", 200, $wantsJson);
}

// Notify the team (best effort)
$subject = 'New launch-list signup — kaidservices.com';
$body    = "New signup: {$email}\nTime (UTC): " . gmdate('Y-m-d H:i:s') . "\n";
$headers = 'From: Kaid Website <' . $config['notify_from'] . ">\r\n" . 'Content-Type: text/plain; charset=utf-8';
@mail($config['notify_to'], $subject, $body, $headers);

respond(true, "You're on the list. We'll be in touch at launch.", 200, $wantsJson);
