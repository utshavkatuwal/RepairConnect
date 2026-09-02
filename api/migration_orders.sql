USE repairconnect;

-- Chat between customer and technician for an order
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  sender_id INT NOT NULL,
  message VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cm_request FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_cm_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_cm_request (request_id)
) ENGINE=InnoDB;

-- Technician online status
ALTER TABLE users ADD COLUMN is_online TINYINT(1) NOT NULL DEFAULT 0 AFTER role;

-- Which technician accepted / is serving the order
ALTER TABLE service_requests ADD COLUMN technician_id INT NULL AFTER user_id;
ALTER TABLE service_requests ADD CONSTRAINT fk_sr_technician FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL;

-- Order journey: recruiting -> accepted -> departed -> reached -> finished
ALTER TABLE service_requests MODIFY COLUMN status ENUM(
  'recruiting','accepted','departed','reached','finished','cancelled','rejected'
) NOT NULL DEFAULT 'recruiting';