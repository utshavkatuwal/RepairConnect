-- RepairConnect billing migration

-- 1. Add 'billing' to the status enum
ALTER TABLE service_requests
  MODIFY COLUMN status ENUM('recruiting','accepted','departed','reached','billing','finished','cancelled','rejected')
  NOT NULL DEFAULT 'recruiting';

-- 2. Add default service price to services table
ALTER TABLE services ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER icon;

-- 3. Set default prices for existing services
UPDATE services SET price = 500  WHERE id = 1;   -- AC Repair
UPDATE services SET price = 300  WHERE id = 2;   -- Plumbing
UPDATE services SET price = 400  WHERE id = 3;   -- Electrical
UPDATE services SET price = 600  WHERE id = 4;   -- Refrigerator Repair
UPDATE services SET price = 500  WHERE id = 5;   -- Washing Machine Repair
UPDATE services SET price = 300  WHERE id = 6;   -- Mobile Repair
UPDATE services SET price = 500  WHERE id = 7;   -- Laptop Repair
UPDATE services SET price = 400  WHERE id = 8;   -- TV Repair
UPDATE services SET price = 350  WHERE id = 9;   -- Carpentry
UPDATE services SET price = 400  WHERE id = 10;  -- Painting

-- 4. Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL UNIQUE,
  technician_id INT NOT NULL,
  service_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create bill extra charges table
CREATE TABLE IF NOT EXISTS bill_extra_charges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bill_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;