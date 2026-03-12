-- ============================================================
-- Sahayog — Database Migration
-- Run this to upgrade your existing schema
-- ============================================================

-- 1. Add role column to users (admin / user)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin') NOT NULL DEFAULT 'user';

-- 2. Upgrade campaigns table
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS user_id INT,
  ADD COLUMN IF NOT EXISTS goal_amount DECIMAL(12, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS raised_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status ENUM('pending', 'approved', 'declined') NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_note TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3. Mark existing campaigns as approved (so old data still shows up)
UPDATE campaigns SET status = 'approved' WHERE status = 'pending';

-- 4. Create your first admin account (change email/password as needed)
--    Password below is bcrypt hash for: Admin@1234
--    You can also just UPDATE an existing user: UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
INSERT INTO users (name, email, password, role)
VALUES (
  'Admin',
  'admin@sahayog.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lwiC',
  'admin'
)
ON DUPLICATE KEY UPDATE role = 'admin';

-- ============================================================
-- Fresh install? Use this instead:
-- ============================================================
/*
CREATE DATABASE IF NOT EXISTS sahayog;
USE sahayog;

CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaigns (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT,
  title         VARCHAR(200)  NOT NULL,
  description   TEXT,
  images        JSON,
  goal_amount   DECIMAL(12,2) DEFAULT NULL,
  raised_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status        ENUM('pending','approved','declined') NOT NULL DEFAULT 'pending',
  admin_note    TEXT DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
*/
