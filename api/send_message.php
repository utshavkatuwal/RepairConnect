<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

$d = body();

$request_id = (int) ($d['request_id'] ?? 0);
$sender_id  = (int) ($d['sender_id'] ?? 0);
$message    = trim($d['message'] ?? '');

if ($request_id <= 0 || $sender_id <= 0 || $message === '') {
    respond(422, false, 'Order, sender and message are required.');
}

if (mb_strlen($message) > 1000) {
    respond(422, false, 'Message is too long.');
}

$pdo = db();

$stmt = $pdo->prepare('SELECT user_id, technician_id FROM service_requests WHERE id = ?');
$stmt->execute([$request_id]);
$order = $stmt->fetch();
if (!$order) {
    respond(404, false, 'Order not found.');
}

// only the customer or the assigned technician can chat
if ($order['user_id'] != $sender_id && (int) $order['technician_id'] !== $sender_id) {
    respond(403, false, 'You are not part of this order.');
}

$stmt = $pdo->prepare('INSERT INTO chat_messages (request_id, sender_id, message) VALUES (?, ?, ?)');
$stmt->execute([$request_id, $sender_id, $message]);

respond(201, true, 'Message sent.', ['message_id' => (int) $pdo->lastInsertId()]);