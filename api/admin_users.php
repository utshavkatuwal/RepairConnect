<?php
require_once __DIR__ . '/config.php';

$pdo          = db();
$method       = $_SERVER['REQUEST_METHOD'];
$allowedRoles = ['customer', 'technician'];

if ($method === 'GET') {
    $admin_id = (int) ($_GET['admin_id'] ?? 0);
    $role     = $_GET['role'] ?? 'all';
    admin_only($admin_id);

    $sql = "SELECT u.id, u.full_name, u.email, u.phone, u.role, u.is_online, u.created_at,
                   (SELECT COUNT(*) FROM service_requests sr WHERE sr.technician_id = u.id) AS jobs_done
            FROM users u";
    $params = [];
    if ($role === 'technician' || $role === 'customer') {
        $sql .= ' WHERE u.role = ?';
        $params[] = $role;
    } else {
        $sql .= " WHERE u.role IN ('customer', 'technician')";
    }
    $sql .= ' ORDER BY u.id DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll();

    $techIds = [];
    foreach ($users as $u) {
        if ($u['role'] === 'technician') $techIds[] = (int) $u['id'];
    }
    if (count($techIds) > 0) {
        $in  = implode(',', array_fill(0, count($techIds), '?'));
        $stmt = $pdo->prepare(
            "SELECT ts.user_id, s.name FROM technician_services ts
             JOIN services s ON s.id = ts.service_id
             WHERE ts.user_id IN ($in)"
        );
        $stmt->execute($techIds);
        $svcMap = [];
        foreach ($stmt->fetchAll() as $row) {
            $svcMap[(int) $row['user_id']][] = $row['name'];
        }
        foreach ($users as &$u) {
            $u['services'] = $svcMap[(int) $u['id']] ?? [];
        }
        unset($u);
    }

    foreach ($users as &$u) {
        $u['id']       = (int) $u['id'];
        $u['is_online'] = (int) $u['is_online'];
        $u['jobs_done'] = (int) $u['jobs_done'];
    }
    unset($u);

    respond(200, true, 'Users loaded.', ['users' => $users]);
}

if ($method !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

$d        = body();
$admin_id = (int) ($d['admin_id'] ?? 0);
$action   = $d['action'] ?? '';
admin_only($admin_id);

if ($action === 'create') {
    $name     = trim($d['name'] ?? '');
    $email    = strtolower(trim($d['email'] ?? ''));
    $phone    = trim($d['phone'] ?? '');
    $password = (string) ($d['password'] ?? '');
    $role     = $d['role'] ?? '';

    if ($name === '' || $email === '' || $phone === '' || $password === '') {
        respond(422, false, 'All fields are required.');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(422, false, 'Please provide a valid email address.');
    }
    if (strlen($password) < 6) {
        respond(422, false, 'Password must be at least 6 characters.');
    }
    if (!in_array($role, $allowedRoles, true)) {
        respond(422, false, 'Role must be customer or technician.');
    }

    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        respond(409, false, 'An account with this email already exists.');
    }

    $services = [];
    if ($role === 'technician') {
        $services = array_values(array_filter(array_map('intval', (array) ($d['services'] ?? []))));
        if (count($services) === 0) {
            respond(422, false, 'Technicians must provide at least one service.');
        }
        $placeholders = implode(',', array_fill(0, count($services), '?'));
        $stmt = $pdo->prepare("SELECT id FROM services WHERE id IN ($placeholders)");
        $stmt->execute($services);
        if (count($stmt->fetchAll()) !== count($services)) {
            respond(422, false, 'One or more selected services are invalid.');
        }
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$name, $email, $phone, $hash, $role]);
    $user_id = (int) $pdo->lastInsertId();

    if ($role === 'technician' && count($services) > 0) {
        $stmt = $pdo->prepare('INSERT INTO technician_services (user_id, service_id) VALUES (?, ?)');
        foreach ($services as $sid) {
            $stmt->execute([$user_id, $sid]);
        }
    }

    respond(201, true, 'User created successfully.');
}

if ($action === 'update') {
    $user_id = (int) ($d['user_id'] ?? 0);
    if ($user_id <= 0) {
        respond(422, false, 'User is required.');
    }

    $stmt = $pdo->prepare('SELECT id, role FROM users WHERE id = ?');
    $stmt->execute([$user_id]);
    $existing = $stmt->fetch();
    if (!$existing) {
        respond(404, false, 'User not found.');
    }
    if ($existing['role'] === 'superadmin' && $user_id !== $admin_id) {
        respond(403, false, 'Super admin accounts cannot be edited.');
    }

    $name     = trim($d['name'] ?? '');
    $email    = strtolower(trim($d['email'] ?? ''));
    $phone    = trim($d['phone'] ?? '');
    $password = (string) ($d['password'] ?? '');
    $role     = $existing['role'];

    if ($name === '' || $email === '' || $phone === '') {
        respond(422, false, 'Name, email and phone are required.');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(422, false, 'Please provide a valid email address.');
    }
    if ($password !== '' && strlen($password) < 6) {
        respond(422, false, 'Password must be at least 6 characters.');
    }

    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
    $stmt->execute([$email, $user_id]);
    if ($stmt->fetch()) {
        respond(409, false, 'Another account already uses this email.');
    }

    $services = [];
    if ($role === 'technician') {
        $services = array_values(array_filter(array_map('intval', (array) ($d['services'] ?? []))));
        if (count($services) === 0) {
            respond(422, false, 'Technicians must provide at least one service.');
        }
        $placeholders = implode(',', array_fill(0, count($services), '?'));
        $stmt = $pdo->prepare("SELECT id FROM services WHERE id IN ($placeholders)");
        $stmt->execute($services);
        if (count($stmt->fetchAll()) !== count($services)) {
            respond(422, false, 'One or more selected services are invalid.');
        }
    }

    if ($password !== '') {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('UPDATE users SET full_name = ?, email = ?, phone = ?, password = ? WHERE id = ?');
        $stmt->execute([$name, $email, $phone, $hash, $user_id]);
    } else {
        $stmt = $pdo->prepare('UPDATE users SET full_name = ?, email = ?, phone = ? WHERE id = ?');
        $stmt->execute([$name, $email, $phone, $user_id]);
    }

    if ($role === 'technician') {
        $stmt = $pdo->prepare('DELETE FROM technician_services WHERE user_id = ?');
        $stmt->execute([$user_id]);
        $stmt = $pdo->prepare('INSERT INTO technician_services (user_id, service_id) VALUES (?, ?)');
        foreach ($services as $sid) {
            $stmt->execute([$user_id, $sid]);
        }
    }

    respond(200, true, 'User updated successfully.');
}

if ($action === 'delete') {
    $user_id = (int) ($d['user_id'] ?? 0);
    if ($user_id <= 0) {
        respond(422, false, 'User is required.');
    }
    if ($user_id === $admin_id) {
        respond(409, false, 'You cannot delete your own account.');
    }

    $stmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
    $stmt->execute([$user_id]);
    $existing = $stmt->fetch();
    if (!$existing) {
        respond(404, false, 'User not found.');
    }
    if ($existing['role'] === 'superadmin') {
        respond(403, false, 'Super admin accounts cannot be deleted.');
    }

    $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$user_id]);

    respond(200, true, 'User deleted successfully.');
}

respond(422, false, 'Unknown action.');