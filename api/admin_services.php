<?php
require_once __DIR__ . '/config.php';

$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $admin_id = (int) ($_GET['admin_id'] ?? 0);
    admin_only($admin_id);

    $stmt = $pdo->query(
        'SELECT id, name, description, icon, is_active, created_at
         FROM services ORDER BY id ASC'
    );
    $services = $stmt->fetchAll();
    foreach ($services as &$s) {
        $s['id']        = (int) $s['id'];
        $s['is_active'] = (int) $s['is_active'];
    }
    unset($s);

    respond(200, true, 'Services loaded.', ['services' => $services]);
}

if ($method !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

$d        = body();
$admin_id = (int) ($d['admin_id'] ?? 0);
$action   = $d['action'] ?? '';
admin_only($admin_id);

if ($action === 'create') {
    $name = trim($d['name'] ?? '');
    if ($name === '') {
        respond(422, false, 'Service name is required.');
    }
    $description = trim($d['description'] ?? '');
    $icon        = trim($d['icon'] ?? '') !== '' ? $d['icon'] : 'AC';

    $stmt = $pdo->prepare('SELECT id FROM services WHERE name = ?');
    $stmt->execute([$name]);
    if ($stmt->fetch()) {
        respond(409, false, 'A service with this name already exists.');
    }

    $stmt = $pdo->prepare('INSERT INTO services (name, description, icon) VALUES (?, ?, ?)');
    $stmt->execute([$name, $description, $icon]);

    respond(201, true, 'Service created successfully.');
}

if ($action === 'update') {
    $name = trim($d['name'] ?? '');
    if ($name === '') {
        respond(422, false, 'Service name is required.');
    }
    $service_id  = (int) ($d['service_id'] ?? 0);
    $description = trim($d['description'] ?? '');
    $icon        = trim($d['icon'] ?? '') !== '' ? $d['icon'] : 'AC';
    $is_active   = !empty($d['is_active']) ? 1 : 0;

    if ($service_id <= 0) {
        respond(422, false, 'Service is required.');
    }

    $stmt = $pdo->prepare('SELECT id FROM services WHERE name = ? AND id != ?');
    $stmt->execute([$name, $service_id]);
    if ($stmt->fetch()) {
        respond(409, false, 'Another service already uses this name.');
    }

    $stmt = $pdo->prepare('UPDATE services SET name = ?, description = ?, icon = ?, is_active = ? WHERE id = ?');
    $stmt->execute([$name, $description, $icon, $is_active, $service_id]);

    respond(200, true, 'Service updated successfully.');
}

if ($action === 'toggle') {
    $service_id  = (int) ($d['service_id'] ?? 0);
    $is_active   = !empty($d['is_active']) ? 1 : 0;
    if ($service_id <= 0) {
        respond(422, false, 'Service is required.');
    }
    $stmt = $pdo->prepare('UPDATE services SET is_active = ? WHERE id = ?');
    $stmt->execute([$is_active, $service_id]);
    respond(200, true, $is_active ? 'Service is now active.' : 'Service is now hidden.');
}

if ($action === 'delete') {
    $service_id = (int) ($d['service_id'] ?? 0);
    if ($service_id <= 0) {
        respond(422, false, 'Service is required.');
    }
    $stmt = $pdo->prepare('DELETE FROM services WHERE id = ?');
    $stmt->execute([$service_id]);
    respond(200, true, 'Service deleted successfully.');
}

respond(422, false, 'Unknown action.');