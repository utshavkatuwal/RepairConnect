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
    "SELECT sr.id, sr.user_id, sr.technician_id, sr.service_id, sr.address,
            sr.latitude, sr.longitude, sr.status, sr.created_at,
            s.name AS service, s.icon AS service_icon,
            cu.full_name AS customer_name, cu.phone AS customer_phone,
            tu.full_name AS technician_name, tu.phone AS technician_phone
     FROM service_requests sr
     JOIN services s ON s.id = sr.service_id
     JOIN users cu ON cu.id = sr.user_id
     LEFT JOIN users tu ON tu.id = sr.technician_id
     WHERE sr.user_id = ? OR sr.technician_id = ?
     ORDER BY sr.id DESC"
);
$stmt->execute([$user_id, $user_id]);
$orders = $stmt->fetchAll();

foreach ($orders as &$o) {
    $o['id'] = (int) $o['id'];
    $o['user_id'] = (int) $o['user_id'];
    $o['technician_id'] = $o['technician_id'] !== null ? (int) $o['technician_id'] : null;
    $o['service_id'] = (int) $o['service_id'];
    $o['latitude'] = $o['latitude'] !== null ? (float) $o['latitude'] : null;
    $o['longitude'] = $o['longitude'] !== null ? (float) $o['longitude'] : null;
}
unset($o);

respond(200, true, 'Orders loaded.', ['orders' => $orders]);