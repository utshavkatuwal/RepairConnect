USE repairconnect;

ALTER TABLE service_requests
  MODIFY COLUMN status ENUM(
    'recruiting','matched','accepted','scheduled',
    'in_progress','completed','cancelled','rejected'
  ) NOT NULL DEFAULT 'recruiting';