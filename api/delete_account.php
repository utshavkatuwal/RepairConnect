<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

$d = body();

$user_id = (int) ($d['user_id'] ?? 0);

if ($user_id <= 0) {
    respond(422, false, 'User is required.');
}

$pdo = db();

$stmt = $pdo->prepare('SELECT id FROM users WHERE id = ?');
$stmt->execute([$user_id]);
if (!$stmt->fetch()) {
    respond(404, false, 'User not found.');
}

$stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
$stmt->execute([$user_id]);

respond(200, true, 'Account deleted.');