-- CREATE DATABASE IF NOT EXISTS rbac_db;
-- USE rbac_db;

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50),
  action VARCHAR(20)
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id INT,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
);

-- 4. Role Permissions Joint Table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT,
  permission_id INT,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Seeds (Initial Data)
-- Roles
-- INSERT IGNORE INTO roles (id, name) VALUES (1, 'admin'), (2, 'editor'), (3, 'viewer');

-- Permissions
-- INSERT IGNORE INTO permissions (id, name, resource, action) VALUES
-- (1, 'user:view', 'users', 'view'),
-- (2, 'user:create', 'users', 'create'),
-- (3, 'user:edit', 'users', 'edit'),
-- (4, 'user:delete', 'users', 'delete');

-- Role Permissions Relationships
-- INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
-- (1,1),(1,2),(1,3),(1,4),
-- (2,1),(2,2),
-- (3,1);
