<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

$d = body();

$name     = trim($d['name'] ?? '');
$email    = strtolower(trim($d['email'] ?? ''));
$phone    = trim($d['phone'] ?? '');
$password = (string) ($d['password'] ?? '');
$role     = $d['role'] ?? 'customer';

if ($name === '' || $email === '' || $phone === '' || $password === '') {
    respond(422, false, 'All fields are required.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, false, 'Please provide a valid email address.');
}

if (strlen($password) < 6) {
    respond(422, false, 'Password must be at least 6 characters.');
}

if (!in_array($role, ['customer', 'technician'], true)) {
    respond(422, false, 'Role must be customer or technician.');
}

$pdo = db();

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    respond(409, false, 'An account with this email already exists.');
}

// Technician must pick at least one service
$services = [];
if ($role === 'technician') {
    $services = array_values(array_filter(array_map('intval', (array) ($d['services'] ?? []))));
    if (count($services) === 0) {
        respond(422, false, 'Please choose at least one service you provide.');
    }
    $placeholders = implode(',', array_fill(0, count($services), '?'));
    $stmt = $pdo->prepare("SELECT id FROM services WHERE id IN ($placeholders)");
    $stmt->execute($services);
    if (count($stmt->fetchAll()) !== count($services)) {
        respond(422, false, 'One or more selected services are invalid.');
    }
}

$hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $pdo->prepare(
    'INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)'
);
$stmt->execute([$name, $email, $phone, $hash, $role]);
$user_id = (int) $pdo->lastInsertId();

if ($role === 'technician' && count($services) > 0) {
    $stmt = $pdo->prepare('INSERT INTO technician_services (user_id, service_id) VALUES (?, ?)');
    foreach ($services as $sid) {
        $stmt->execute([$user_id, $sid]);
    }
}

respond(201, true, 'Account created successfully. You can now log in.');