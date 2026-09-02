<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(405, false, 'Method not allowed.');
}

$admin_id = (int) ($_GET['admin_id'] ?? 0);
admin_only($admin_id);

$pdo = db();

$count = function (string $sql, array $params = []) use ($pdo) {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return (int) $stmt->fetchColumn();
};

$stats = [
    'customers'  => $count("SELECT COUNT(*) FROM users WHERE role = 'customer'"),
    'technicians' => $count("SELECT COUNT(*) FROM users WHERE role = 'technician'"),
    'services'   => $count('SELECT COUNT(*) FROM services'),
    'active_services' => $count('SELECT COUNT(*) FROM services WHERE is_active = 1'),
    'online_technicians' => $count("SELECT COUNT(*) FROM users WHERE role = 'technician' AND is_online = 1"),
    'orders'     => $count('SELECT COUNT(*) FROM service_requests'),
    'open_orders' => $count("SELECT COUNT(*) FROM service_requests WHERE status = 'recruiting'"),
    'active_orders' => $count("SELECT COUNT(*) FROM service_requests WHERE status IN ('accepted','departed','reached','billing')"),
    'finished_orders' => $count("SELECT COUNT(*) FROM service_requests WHERE status = 'finished'"),
    'cancelled_orders' => $count("SELECT COUNT(*) FROM service_requests WHERE status = 'cancelled'"),
    'bills'      => $count('SELECT COUNT(*) FROM bills'),
    'revenue'    => (float) $pdo->query("SELECT COALESCE(SUM(b.service_charge + COALESCE((SELECT SUM(amount) FROM bill_extra_charges WHERE bill_id = b.id), 0)), 0) FROM bills b")->fetchColumn(),
];

respond(200, true, 'Stats loaded.', ['stats' => $stats]);