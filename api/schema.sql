CREATE DATABASE IF NOT EXISTS repairconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE repairconnect;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer', 'technician', 'superadmin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO users (full_name, email, phone, password, role)
VALUES ('Super Admin', 'super@repairconnect.com', '0000000000', '$2y$10$e5S1RIe6tImK8EXbMU6fbe7GSHlpV6qRBkBvNTmEOh3KrtN9hkQNS', 'superadmin')
ON DUPLICATE KEY UPDATE email = email;