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

$stmt = $pdo->prepare('SELECT id FROM service_requests WHERE id = ? AND user_id = ?');
$stmt->execute([$request_id, $user_id]);
if (!$stmt->fetch()) {
    respond(404, false, 'Request not found.');
}

$stmt = $pdo->prepare("UPDATE service_requests SET status = 'cancelled' WHERE id = ?");
$stmt->execute([$request_id]);

respond(200, true, 'Search cancelled.', ['request_id' => $request_id]);