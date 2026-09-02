<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

$d = body();

$user_id = (int) ($d['user_id'] ?? 0);
$name    = trim($d['name'] ?? '');
$email   = strtolower(trim($d['email'] ?? ''));
$phone   = trim($d['phone'] ?? '');
$password = (string) ($d['password'] ?? '');

if ($user_id <= 0 || $name === '' || $email === '' || $phone === '') {
    respond(422, false, 'Name, email and phone are required.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, false, 'Please provide a valid email address.');
}

if ($password !== '' && strlen($password) < 6) {
    respond(422, false, 'Password must be at least 6 characters.');
}

$pdo = db();

$stmt = $pdo->prepare('SELECT id FROM users WHERE id = ?');
$stmt->execute([$user_id]);
if (!$stmt->fetch()) {
    respond(404, false, 'User not found.');
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id <> ?');
$stmt->execute([$email, $user_id]);
if ($stmt->fetch()) {
    respond(409, false, 'An account with this email already exists.');
}

if ($password !== '') {
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare(
        'UPDATE users SET full_name = ?, email = ?, phone = ?, password = ? WHERE id = ?'
    );
    $stmt->execute([$name, $email, $phone, $hash, $user_id]);
} else {
    $stmt = $pdo->prepare(
        'UPDATE users SET full_name = ?, email = ?, phone = ? WHERE id = ?'
    );
    $stmt->execute([$name, $email, $phone, $user_id]);
}

$stmt = $pdo->prepare('SELECT id, full_name, email, phone, role FROM users WHERE id = ?');
$stmt->execute([$user_id]);
$user = $stmt->fetch();
$user['id'] = (int) $user['id'];

respond(200, true, 'Profile updated.', ['user' => $user]);