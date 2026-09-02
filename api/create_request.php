<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

$d = body();

$user_id   = (int) ($d['user_id'] ?? 0);
$service_id = (int) ($d['service_id'] ?? 0);
$lat        = isset($d['latitude']) && $d['latitude'] !== '' ? (float) $d['latitude'] : null;
$lng        = isset($d['longitude']) && $d['longitude'] !== '' ? (float) $d['longitude'] : null;
$address    = trim($d['address'] ?? '');

if ($user_id <= 0 || $service_id <= 0 || $lat === null || $lng === null || $address === '') {
    respond(422, false, 'Service, location and address are required.');
}

$pdo = db();

$stmt = $pdo->prepare('SELECT id, role FROM users WHERE id = ?');
$stmt->execute([$user_id]);
$user = $stmt->fetch();
if (!$user || $user['role'] !== 'customer') {
    respond(403, false, 'Only customers can create service requests.');
}

$stmt = $pdo->prepare('SELECT id, name FROM services WHERE id = ? AND is_active = 1');
$stmt->execute([$service_id]);
$service = $stmt->fetch();
if (!$service) {
    respond(404, false, 'Service not found.');
}

$stmt = $pdo->prepare(
    'INSERT INTO service_requests (user_id, service_id, latitude, longitude, address, status)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$stmt->execute([$user_id, $service_id, $lat, $lng, $address, 'recruiting']);
$request_id = (int) $pdo->lastInsertId();

respond(201, true, 'Request created. Searching for a technician...', [
    'request_id' => $request_id,
    'service'    => $service['name'],
]);