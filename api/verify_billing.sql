SELECT 'status' AS col_name, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='repairconnect' AND TABLE_NAME='service_requests' AND COLUMN_NAME='status';
SELECT 'price' AS col_name, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='repairconnect' AND TABLE_NAME='services' AND COLUMN_NAME='price';
SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='repairconnect' AND TABLE_NAME IN ('bills','bill_extra_charges');
SELECT COUNT(*) AS service_count FROM services WHERE price > 0;
