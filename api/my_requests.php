<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(405, false, 'Method not allowed.');
}

$user_id = (int) ($_GET['user_id'] ?? 0);

if ($user_id <= 0) {
    respond(422, false, 'User is required.');
}

$pdo = db();

$stmt = $pdo->prepare(
    "SELECT sr.id, sr.address, sr.latitude, sr.longitude, sr.status, sr.created_at,
            s.name AS service, s.icon AS service_icon
     FROM service_requests sr
     JOIN services s ON s.id = sr.service_id
     WHERE sr.user_id = ?
     ORDER BY sr.id DESC"
);
$stmt->execute([$user_id]);
$requests = $stmt->fetchAll();

foreach ($requests as &$r) {
    $r['id'] = (int) $r['id'];
    $r['latitude'] = $r['latitude'] !== null ? (float) $r['latitude'] : null;
    $r['longitude'] = $r['longitude'] !== null ? (float) $r['longitude'] : null;
}
unset($r);

respond(200, true, 'History loaded.', ['requests' => $requests]);