<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

$d = body();

$request_id = (int) ($d['request_id'] ?? 0);
$user_id    = (int) ($d['user_id'] ?? 0);

if ($request_id <= 0 || $user_id <= 0) {
    respond(422, false, 'Request and user are required.');
}

$pdo = db();

$stmt = $pdo->prepare('SELECT id, role FROM users WHERE id = ?');
$stmt->execute([$user_id]);
$u = $stmt->fetch();
if (!$u || $u['role'] !== 'technician') {
    respond(403, false, 'Only technicians can accept orders.');
}

$stmt = $pdo->prepare('SELECT id, service_id, status FROM service_requests WHERE id = ?');
$stmt->execute([$request_id]);
$order = $stmt->fetch();
if (!$order) {
    respond(404, false, 'Order not found.');
}
if ($order['status'] !== 'recruiting') {
    respond(409, false, 'This order is no longer available.');
}

// make sure this technician offers the service
$stmt = $pdo->prepare('SELECT id FROM technician_services WHERE user_id = ? AND service_id = ?');
$stmt->execute([$user_id, $order['service_id']]);
if (!$stmt->fetch()) {
    respond(403, false, 'You do not offer this service.');
}

$stmt = $pdo->prepare("UPDATE service_requests SET technician_id = ?, status = 'accepted' WHERE id = ?");
$stmt->execute([$user_id, $request_id]);

respond(200, true, 'Order accepted. You are now connected with the customer.', [
    'request_id' => $request_id,
]);