import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'rbac_db',
} = process.env;

let pool: mysql.Pool;

export async function initDatabase() {
  console.log('🔄 Checking database connection and initializing schema...');

  // Step 1: Create a connection to MySQL server without database specified to verify/create DB
  const initialConnection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
  });

  try {
    // Create database if not exists
    await initialConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    console.log(`✅ Database \`${DB_NAME}\` verified/created.`);
  } catch (error) {
    console.error('❌ Failed to create/verify database:', error);
    throw error;
  } finally {
    await initialConnection.end();
  }

  // Step 2: Initialize connection pool with the specific database
  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Step 3: Run table creations and seed initial data
  try {
    // Roles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Permissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) UNIQUE NOT NULL,
        resource VARCHAR(50),
        action VARCHAR(20)
      );
    `);

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role_id INT,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
      );
    `);

    // Role Permissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INT,
        permission_id INT,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      );
    `);

    console.log('✅ Relational schema verified.');

    // Seed roles if empty
    const [rolesCount] = await pool.query<any>('SELECT COUNT(*) as count FROM roles');
    if (rolesCount[0].count === 0) {
      console.log('🌱 Seeding roles...');
      await pool.query("INSERT INTO roles (id, name) VALUES (1, 'admin'), (2, 'editor'), (3, 'viewer')");
    }

    // Seed permissions if empty
    const [permissionsCount] = await pool.query<any>('SELECT COUNT(*) as count FROM permissions');
    if (permissionsCount[0].count === 0) {
      console.log('🌱 Seeding permissions...');
      await pool.query(`
        INSERT INTO permissions (id, name, resource, action) VALUES
        (1, 'user:view', 'users', 'view'),
        (2, 'user:create', 'users', 'create'),
        (3, 'user:edit', 'users', 'edit'),
        (4, 'user:delete', 'users', 'delete')
      `);
    }

    // Seed role_permissions if empty
    const [rpCount] = await pool.query<any>('SELECT COUNT(*) as count FROM role_permissions');
    if (rpCount[0].count === 0) {
      console.log('🌱 Seeding role_permissions relationships...');
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id) VALUES
        (1, 1), (1, 2), (1, 3), (1, 4), -- admin has all permissions
        (2, 1), (2, 2),                 -- editor has user:view and user:create
        (3, 1)                          -- viewer has only user:view
      `);
    }

    // Seed users if empty
    const [usersCount] = await pool.query<any>('SELECT COUNT(*) as count FROM users');
    if (usersCount[0].count === 0) {
      console.log('🌱 Seeding default accounts (admin, editor, viewer) with secure password hashing...');
      
      const adminHash = await Bun.password.hash('admin123', {
        algorithm: 'bcrypt',
        cost: 10
      });
      const editorHash = await Bun.password.hash('editor123', {
        algorithm: 'bcrypt',
        cost: 10
      });
      const viewerHash = await Bun.password.hash('viewer123', {
        algorithm: 'bcrypt',
        cost: 10
      });

      await pool.query('INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)', ['admin', adminHash, 1]);
      await pool.query('INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)', ['editor', editorHash, 2]);
      await pool.query('INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)', ['viewer', viewerHash, 3]);
      
      console.log('✅ Seeding completed successfully.');
    } else {
      console.log('✅ Seeds already present.');
    }

  } catch (error) {
    console.error('❌ Error during schema initialization:', error);
    throw error;
  }
}

export function getPool(): mysql.Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDatabase() first.');
  }
  return pool;
}

export async function query(sql: string, params?: any[]): Promise<any> {
  const [results] = await getPool().query(sql, params);
  return results;
}
