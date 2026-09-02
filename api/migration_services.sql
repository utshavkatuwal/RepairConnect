USE repairconnect;

-- Service categories managed by admin
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL DEFAULT '',
  icon VARCHAR(10) NOT NULL DEFAULT '🔧',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Which services each technician provides
CREATE TABLE IF NOT EXISTS technician_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  service_id INT NOT NULL,
  UNIQUE KEY uniq_tech_service (user_id, service_id),
  CONSTRAINT fk_ts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ts_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Customer booking requests
CREATE TABLE IF NOT EXISTS service_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  service_id INT NOT NULL,
  latitude DECIMAL(10,7) DEFAULT NULL,
  longitude DECIMAL(10,7) DEFAULT NULL,
  address VARCHAR(500) NOT NULL DEFAULT '',
  status ENUM('recruiting','matched','accepted','scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'recruiting',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sr_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Dummy services (admin-driven, seeder placeholder)
INSERT INTO services (name, description, icon) VALUES
  ('AC Repair', 'Split, window and central AC servicing and repair', 'AC'),
  ('Plumbing', 'Leaks, pipes, taps, fittings and drainage', 'PL'),
  ('Electrical', 'Wiring, switches, sockets, lights and faults', 'EL'),
  ('Refrigerator Repair', 'Fridge cooling, gas refill and compressor issues', 'RF'),
  ('Washing Machine Repair', 'Drum, motor, drain and display faults', 'WM'),
  ('Mobile Repair', 'Screen, battery, charging and software issues', 'MB'),
  ('Laptop Repair', 'Hardware, keyboard, display and OS problems', 'LP'),
  ('TV Repair', 'Display, mainboard, sound and connectivity issues', 'TV'),
  ('Carpentry', 'Doors, furniture repair, fixtures and assembly', 'CP'),
  ('Painting', 'Interior & exterior painting and touch-ups', 'PN')
ON DUPLICATE KEY UPDATE name = name;