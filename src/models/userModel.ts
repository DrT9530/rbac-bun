import { query } from '../config/database';

export interface User {
  id?: number;
  username: string;
  password?: string;
  role_id?: number | null;
  role_name?: string;
}

export const UserModel = {
  async getAllUsers(): Promise<User[]> {
    const rows = await query(`
      SELECT u.id, u.username, u.role_id, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id DESC
    `);
    return rows as User[];
  },

  async createUser(user: User): Promise<number> {
    const result = await query(
      'INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)',
      [user.username, user.password, user.role_id || null]
    );
    return result.insertId;
  },

  async deleteUser(id: number): Promise<void> {
    await query('DELETE FROM users WHERE id = ?', [id]);
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const rows = await query('SELECT * FROM users WHERE username = ?', [username]);
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  },

  async getUserWithPermissions(userId: number): Promise<{
    user: User;
    permissions: string[];
  } | null> {
    const rows = await query(`
      SELECT u.id, u.username, u.role_id, r.name as role_name, p.name as permission_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ?
    `, [userId]);

    const results = rows as any[];
    if (results.length === 0) return null;

    const user: User = {
      id: results[0].id,
      username: results[0].username,
      role_id: results[0].role_id,
      role_name: results[0].role_name || 'No Role'
    };

    // Filter out null permission names and create unique permissions array
    const permissions: string[] = results
      .map(r => r.permission_name)
      .filter((p): p is string => !!p);

    return { user, permissions };
  }
};
