import { query } from '../config/database';

export interface Permission {
  id?: number;
  name: string;
  resource: string;
  action: string;
}

export const PermissionModel = {
  async getAllPermissions(): Promise<Permission[]> {
    const rows = await query('SELECT * FROM permissions ORDER BY resource, action');
    return rows as Permission[];
  },

  async createPermission(permission: Permission): Promise<number> {
    const result = await query(
      'INSERT INTO permissions (name, resource, action) VALUES (?, ?, ?)',
      [permission.name, permission.resource, permission.action]
    );
    return result.insertId;
  },

  async getPermissionById(id: number): Promise<Permission | null> {
    const rows = await query('SELECT * FROM permissions WHERE id = ?', [id]);
    const perms = rows as Permission[];
    return perms.length > 0 ? perms[0] : null;
  }
};
