<?php
require_once __DIR__ . '/config.php';

$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $admin_id = (int) ($_GET['admin_id'] ?? 0);
    $status   = $_GET['status'] ?? '';
    admin_only($admin_id);

    $sql = "SELECT sr.id, sr.status, sr.address, sr.latitude, sr.longitude, sr.created_at,
                   s.name AS service, s.icon AS service_icon,
                   cu.full_name AS customer_name, cu.phone AS customer_phone,
                   tu.full_name AS technician_name, tu.phone AS technician_phone
            FROM service_requests sr
            JOIN services s ON s.id = sr.service_id
            JOIN users cu ON cu.id = sr.user_id
            LEFT JOIN users tu ON tu.id = sr.technician_id";
    $params = [];
    $allowed = ['recruiting', 'accepted', 'departed', 'reached', 'finished', 'cancelled', 'rejected'];
    if (in_array($status, $allowed, true)) {
        $sql .= ' WHERE sr.status = ?';
        $params[] = $status;
    }
    $sql .= ' ORDER BY sr.id DESC LIMIT 300';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();

    foreach ($orders as &$o) {
        $o['id']        = (int) $o['id'];
        $o['latitude']  = $o['latitude'] !== null ? (float) $o['latitude'] : null;
        $o['longitude'] = $o['longitude'] !== null ? (float) $o['longitude'] : null;
    }
    unset($o);

    respond(200, true, 'Orders loaded.', ['orders' => $orders]);
}

if ($method !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

$d        = body();
$admin_id = (int) ($d['admin_id'] ?? 0);
$action   = $d['action'] ?? '';
admin_only($admin_id);

$request_id = (int) ($d['request_id'] ?? 0);
if ($request_id <= 0) {
    respond(422, false, 'Order is required.');
}

if ($action === 'cancel') {
    $stmt = $pdo->prepare("UPDATE service_requests SET status = 'cancelled' WHERE id = ?");
    $stmt->execute([$request_id]);
    respond(200, true, 'Order cancelled.');
}

if ($action === 'delete') {
    $stmt = $pdo->prepare('DELETE FROM service_requests WHERE id = ?');
    $stmt->execute([$request_id]);
    respond(200, true, 'Order deleted.');
}

respond(422, false, 'Unknown action.');