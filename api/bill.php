<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo    = db();

// ── GET: fetch bill + extras ──
if ($method === 'GET') {
    $request_id = (int) ($_GET['request_id'] ?? 0);
    if ($request_id <= 0) {
        respond(422, false, 'request_id is required.');
    }

    $stmt = $pdo->prepare('SELECT b.*, sr.technician_id, sr.status,
        s.name AS service_name, s.price AS service_price,
        u.full_name AS technician_name
        FROM bills b
        JOIN service_requests sr ON sr.id = b.request_id
        JOIN services s ON s.id = sr.service_id
        JOIN users u ON u.id = b.technician_id
        WHERE b.request_id = ?');
    $stmt->execute([$request_id]);
    $bill = $stmt->fetch();

    if (!$bill) {
        respond(200, true, 'No bill yet.', ['bill' => null]);
    }

    $stmt = $pdo->prepare('SELECT id, name, amount FROM bill_extra_charges WHERE bill_id = ? ORDER BY id');
    $stmt->execute([$bill['id']]);
    $extras = $stmt->fetchAll();

    $total = (float) $bill['service_charge'];
    foreach ($extras as $e) {
        $total += (float) $e['amount'];
    }

    respond(200, true, 'Bill found.', [
        'bill' => [
            'id'             => (int) $bill['id'],
            'request_id'     => (int) $bill['request_id'],
            'technician_id'  => (int) $bill['technician_id'],
            'service_charge' => (float) $bill['service_charge'],
            'service_name'   => $bill['service_name'],
            'service_price'  => (float) $bill['service_price'],
            'technician_name'=> $bill['technician_name'],
            'status'         => $bill['status'],
            'created_at'     => $bill['created_at'],
            'extras'         => array_map(fn($e) => [
                'id'     => (int) $e['id'],
                'name'   => $e['name'],
                'amount' => (float) $e['amount'],
            ], $extras),
            'total'          => round($total, 2),
        ],
    ]);
}

// ── POST actions ──
if ($method !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

$d = body();
$action    = $d['action'] ?? '';
$user_id   = (int) ($d['user_id'] ?? 0);
$request_id= (int) ($d['request_id'] ?? 0);

if ($user_id <= 0 || $request_id <= 0 || $action === '') {
    respond(422, false, 'user_id, request_id, and action are required.');
}

// verify the user is the technician on this order
$stmt = $pdo->prepare('SELECT id, technician_id, status FROM service_requests WHERE id = ?');
$stmt->execute([$request_id]);
$order = $stmt->fetch();
if (!$order) {
    respond(404, false, 'Order not found.');
}
if ((int) $order['technician_id'] !== $user_id) {
    respond(403, false, 'This order is not assigned to you.');
}

// ── CREATE bill ──
if ($action === 'create') {
    if (!in_array($order['status'], ['reached', 'billing'], true)) {
        respond(409, false, 'You must have arrived at the customer before creating a bill.');
    }

    // check if bill already exists
    $stmt = $pdo->prepare('SELECT id FROM bills WHERE request_id = ?');
    $stmt->execute([$request_id]);
    if ($stmt->fetch()) {
        respond(409, false, 'Bill already exists for this order.');
    }

    // get service default price
    $stmt = $pdo->prepare('SELECT s.price FROM service_requests sr JOIN services s ON s.id = sr.service_id WHERE sr.id = ?');
    $stmt->execute([$request_id]);
    $svc = $stmt->fetch();
    $service_charge = (float) ($svc['price'] ?? 0);

    $stmt = $pdo->prepare('INSERT INTO bills (request_id, technician_id, service_charge) VALUES (?, ?, ?)');
    $stmt->execute([$request_id, $user_id, $service_charge]);
    $bill_id = (int) $pdo->lastInsertId();

    // also advance status to billing if it's still 'reached'
    if ($order['status'] === 'reached') {
        $stmt = $pdo->prepare('UPDATE service_requests SET status = ? WHERE id = ?');
        $stmt->execute(['billing', $request_id]);
    }

    respond(201, true, 'Bill created.', ['bill_id' => $bill_id, 'service_charge' => $service_charge]);
}

// ── ADD extra charge ──
if ($action === 'add_extra') {
    $name   = trim($d['name'] ?? '');
    $amount = (float) ($d['amount'] ?? 0);

    if ($name === '' || $amount <= 0) {
        respond(422, false, 'A name and a positive amount are required.');
    }
    if (strlen($name) > 200) {
        respond(422, false, 'Charge name must be 200 characters or fewer.');
    }
    if ($order['status'] !== 'billing') {
        respond(409, false, 'You can only add charges while billing.');
    }

    $stmt = $pdo->prepare('SELECT id FROM bills WHERE request_id = ?');
    $stmt->execute([$request_id]);
    $bill = $stmt->fetch();
    if (!$bill) {
        respond(404, false, 'No bill exists for this order. Create it first.');
    }

    $stmt = $pdo->prepare('INSERT INTO bill_extra_charges (bill_id, name, amount) VALUES (?, ?, ?)');
    $stmt->execute([(int) $bill['id'], $name, $amount]);

    respond(201, true, 'Extra charge added.', ['charge_id' => (int) $pdo->lastInsertId()]);
}

// ── REMOVE extra charge ──
if ($action === 'remove_extra') {
    $charge_id = (int) ($d['charge_id'] ?? 0);
    if ($charge_id <= 0) {
        respond(422, false, 'charge_id is required.');
    }
    if ($order['status'] !== 'billing') {
        respond(409, false, 'You can only modify charges while billing.');
    }

    $stmt = $pdo->prepare('SELECT b.id FROM bill_extra_charges bec JOIN bills b ON b.id = bec.bill_id WHERE bec.id = ? AND b.request_id = ?');
    $stmt->execute([$charge_id, $request_id]);
    if (!$stmt->fetch()) {
        respond(404, false, 'Charge not found.');
    }

    $stmt = $pdo->prepare('DELETE FROM bill_extra_charges WHERE id = ?');
    $stmt->execute([$charge_id]);

    respond(200, true, 'Extra charge removed.');
}

respond(422, false, 'Unknown action.');
