<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(405, false, 'Method not allowed.');
}

$pdo = db();

$stmt = $pdo->query('SELECT id, name, description, icon FROM services WHERE is_active = 1 ORDER BY name ASC');
$services = $stmt->fetchAll();

respond(200, true, 'Services loaded.', ['services' => $services]);