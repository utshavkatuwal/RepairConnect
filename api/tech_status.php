<?php
require_once __DIR__ . '/config.php';

$pdo = db();

// GET -> read current online status (survives page refresh)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user_id = (int) ($_GET['user_id'] ?? 0);
    if ($user_id <= 0) {
        respond(422, false, 'User is required.');
    }
    $stmt = $pdo->prepare('SELECT role, is_online FROM users WHERE id = ?');
    $stmt->execute([$user_id]);
    $u = $stmt->fetch();
    if (!$u) {
        respond(404, false, 'User not found.');
    }
    if ($u['role'] !== 'technician') {
        respond(403, false, 'Only technicians can go online/offline.');
    }
    respond(200, true, 'Status loaded.', ['online' => (bool) $u['is_online']]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

$d = body();

$user_id = (int) ($d['user_id'] ?? 0);
$online  = !empty($d['online']);

if ($user_id <= 0) {
    respond(422, false, 'User is required.');
}

$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$u = $stmt->fetch();
if (!$u) {
    respond(404, false, 'User not found.');
}
if ($u['role'] !== 'technician') {
    respond(403, false, 'Only technicians can go online/offline.');
}

$stmt = $pdo->prepare('UPDATE users SET is_online = ? WHERE id = ?');
$stmt->execute([$online ? 1 : 0, $user_id]);

respond(200, true, $online ? 'You are now online.' : 'You are now offline.', ['online' => $online]);