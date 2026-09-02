<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(405, false, 'Method not allowed.');
}

$request_id = (int) ($_GET['request_id'] ?? 0);
$user_id    = (int) ($_GET['user_id'] ?? 0);

if ($request_id <= 0 || $user_id <= 0) {
    respond(422, false, 'Request and user are required.');
}

$pdo = db();

$stmt = $pdo->prepare(
    "SELECT sr.id, sr.user_id, sr.technician_id, sr.service_id, sr.status, sr.created_at,
            s.name AS service, s.icon AS service_icon,
            tu.full_name AS technician_name, tu.phone AS technician_phone, tu.email AS technician_email
     FROM service_requests sr
     JOIN services s ON s.id = sr.service_id
     LEFT JOIN users tu ON tu.id = sr.technician_id
     WHERE sr.id = ?"
);
$stmt->execute([$request_id]);
$r = $stmt->fetch();
if (!$r) {
    respond(404, false, 'Request not found.');
}
if ((int) $r['user_id'] !== $user_id) {
    respond(403, false, 'You do not own this request.');
}

$r['id'] = (int) $r['id'];
$r['user_id'] = (int) $r['user_id'];
$r['technician_id'] = $r['technician_id'] !== null ? (int) $r['technician_id'] : null;
$r['service_id'] = (int) $r['service_id'];

respond(200, true, 'Request status loaded.', ['request' => $r]);