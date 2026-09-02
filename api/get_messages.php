<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(405, false, 'Method not allowed.');
}

$request_id = (int) ($_GET['request_id'] ?? 0);

if ($request_id <= 0) {
    respond(422, false, 'Order is required.');
}

$pdo = db();

$stmt = $pdo->prepare(
    'SELECT m.id, m.sender_id, m.message, m.created_at, u.full_name AS sender_name
     FROM chat_messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.request_id = ?
     ORDER BY m.id ASC
     LIMIT 200'
);
$stmt->execute([$request_id]);
$messages = $stmt->fetchAll();

foreach ($messages as &$m) {
    $m['id'] = (int) $m['id'];
    $m['sender_id'] = (int) $m['sender_id'];
}
unset($m);

respond(200, true, 'Messages loaded.', ['messages' => $messages]);