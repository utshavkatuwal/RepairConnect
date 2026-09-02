<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

$d = body();

$email    = strtolower(trim($d['email'] ?? ''));
$password = (string) ($d['password'] ?? '');

if ($email === '' || $password === '') {
    respond(422, false, 'Email and password are required.');
}

$pdo = db();

$stmt = $pdo->prepare('SELECT id, full_name, email, phone, password, role FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    respond(401, false, 'Invalid email or password.');
}

respond(200, true, 'Login successful.', [
    'user' => [
        'id'       => (int) $user['id'],
        'name'     => $user['full_name'],
        'email'    => $user['email'],
        'phone'    => $user['phone'],
        'role'     => $user['role'],
    ],
]);