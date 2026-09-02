<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

$d = body();

$request_id = (int) ($d['request_id'] ?? 0);
$user_id    = (int) ($d['user_id'] ?? 0);
$status     = $d['status'] ?? '';

$allowed = ['departed', 'reached', 'billing', 'finished'];
if ($request_id <= 0 || $user_id <= 0 || !in_array($status, $allowed, true)) {
    respond(422, false, 'Order, user and a valid status are required.');
}

$pdo = db();

$stmt = $pdo->prepare('SELECT id, technician_id, status FROM service_requests WHERE id = ?');
$stmt->execute([$request_id]);
$order = $stmt->fetch();
if (!$order) {
    respond(404, false, 'Order not found.');
}
if ((int) $order['technician_id'] !== $user_id) {
    respond(403, false, 'This order is not assigned to you.');
}

// technician must advance in order
if ($order['status'] === 'accepted' && $status === 'departed') {
    // ok
} elseif ($order['status'] === 'departed' && $status === 'reached') {
    // ok
} elseif ($order['status'] === 'reached' && $status === 'billing') {
    // ok — auto-create bill if one doesn't exist yet
    $stmt = $pdo->prepare('SELECT id FROM bills WHERE request_id = ?');
    $stmt->execute([$request_id]);
    if (!$stmt->fetch()) {
        $stmt = $pdo->prepare('SELECT s.price FROM service_requests sr JOIN services s ON s.id = sr.service_id WHERE sr.id = ?');
        $stmt->execute([$request_id]);
        $svc = $stmt->fetch();
        $service_charge = (float) ($svc['price'] ?? 0);

        $stmt = $pdo->prepare('INSERT INTO bills (request_id, technician_id, service_charge) VALUES (?, ?, ?)');
        $stmt->execute([$request_id, $user_id, $service_charge]);
    }
} elseif ($order['status'] === 'billing' && $status === 'finished') {
    // ok
} else {
    respond(409, false, 'Order status must advance in sequence.');
}

$stmt = $pdo->prepare('UPDATE service_requests SET status = ? WHERE id = ?');
$stmt->execute([$status, $request_id]);

respond(200, true, 'Order updated.', ['request_id' => $request_id, 'status' => $status]);