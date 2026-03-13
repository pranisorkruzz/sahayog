

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin') NOT NULL DEFAULT 'user';

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS user_id INT,
  ADD COLUMN IF NOT EXISTS goal_amount DECIMAL(12, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS raised_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status ENUM('pending', 'approved', 'declined') NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_note TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE campaigns SET status = 'approved' WHERE status = 'pending';


INSERT INTO users (name, email, password, role)
VALUES (
  'Admin',
  'admin@sahayog.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lwiC',
  'admin'
)
ON DUPLICATE KEY UPDATE role = 'admin';
