import { query, getPool } from '../config/database';

export interface Role {
  id?: number;
  name: string;
  created_at?: Date;
}

export const RoleModel = {
  async getAllRoles(): Promise<Role[]> {
    const rows = await query('SELECT * FROM roles ORDER BY id');
    return rows as Role[];
  },

  async createRole(name: string): Promise<number> {
    const result = await query('INSERT INTO roles (name) VALUES (?)', [name]);
    return result.insertId;
  },

  async getRoleById(id: number): Promise<Role | null> {
    const rows = await query('SELECT * FROM roles WHERE id = ?', [id]);
    const roles = rows as Role[];
    return roles.length > 0 ? roles[0] : null;
  },

  async getRolePermissions(roleId: number): Promise<number[]> {
    const rows = await query('SELECT permission_id FROM role_permissions WHERE role_id = ?', [roleId]);
    return (rows as { permission_id: number }[]).map(row => row.permission_id);
  },

  async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Clear existing associations
      await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);

      // Add new associations
      if (permissionIds.length > 0) {
        const values = permissionIds.map(permId => [roleId, permId]);
        await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [values]);
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};
