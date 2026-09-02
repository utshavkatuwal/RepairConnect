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

$stmt = $pdo->prepare('SELECT id, role FROM users WHERE id = ?');
$stmt->execute([$user_id]);
$u = $stmt->fetch();
if (!$u || $u['role'] !== 'technician') {
    respond(403, false, 'Only technicians can view available orders.');
}

$stmt = $pdo->prepare(
    "SELECT sr.id, sr.service_id, sr.address, sr.latitude, sr.longitude, sr.created_at,
            s.name AS service, s.icon AS service_icon,
            u.full_name AS customer_name, u.phone AS customer_phone
     FROM service_requests sr
     JOIN services s ON s.id = sr.service_id
     JOIN users u ON u.id = sr.user_id
     WHERE sr.status = 'recruiting'
       AND sr.service_id IN (SELECT service_id FROM technician_services WHERE user_id = ?)
     ORDER BY sr.id DESC"
);
$stmt->execute([$user_id]);
$orders = $stmt->fetchAll();

foreach ($orders as &$o) {
    $o['id'] = (int) $o['id'];
    $o['service_id'] = (int) $o['service_id'];
    $o['latitude'] = $o['latitude'] !== null ? (float) $o['latitude'] : null;
    $o['longitude'] = $o['longitude'] !== null ? (float) $o['longitude'] : null;
}
unset($o);

respond(200, true, 'Available orders loaded.', ['orders' => $orders]);