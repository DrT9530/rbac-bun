import { Request, Response } from 'express';
import { RoleModel } from '../models/roleModel';
import { PermissionModel } from '../models/permissionModel';

export const RoleController = {
  // GET /roles (Permission: role:view or similar)
  async listRoles(req: Request, res: Response) {
    try {
      const roles = await RoleModel.getAllRoles();
      const permissions = await PermissionModel.getAllPermissions();

      // Build a map of permission_ids for each role
      const rolePermissionsMap: Record<number, number[]> = {};
      for (const role of roles) {
        if (role.id) {
          rolePermissionsMap[role.id] = await RoleModel.getRolePermissions(role.id);
        }
      }

      const error = req.query.error as string;
      const success = req.query.success as string;

      res.render('roles/index', {
        roles,
        permissions,
        rolePermissionsMap,
        error,
        success,
        title: 'Role Management'
      });
    } catch (err) {
      console.error('List roles error:', err);
      res.status(500).send('Internal Server Error');
    }
  },

  // POST /roles (Permission: role:create)
  async storeRole(req: Request, res: Response) {
    const { name } = req.body;

    if (!name) {
      return res.redirect('/roles?error=Role Name is required');
    }

    try {
      // Normalize role name to lowercase
      const formattedName = name.toLowerCase().trim();
      
      // Check for duplicates
      const roles = await RoleModel.getAllRoles();
      if (roles.some(r => r.name.toLowerCase() === formattedName)) {
        return res.redirect('/roles?error=Role already exists');
      }

      await RoleModel.createRole(formattedName);
      res.redirect('/roles?success=Role created successfully');
    } catch (err) {
      console.error('Create role error:', err);
      res.redirect('/roles?error=Failed to create role');
    }
  },

  // POST /roles/assign (Permission: role:edit)
  async assignPermissions(req: Request, res: Response) {
    const { role_id, permissions } = req.body;

    if (!role_id) {
      return res.redirect('/roles?error=Role ID is required');
    }

    try {
      // permissions can be undefined (if all unchecked), a single string, or an array of strings
      let permissionIds: number[] = [];
      if (permissions) {
        if (Array.isArray(permissions)) {
          permissionIds = permissions.map(id => parseInt(id));
        } else {
          permissionIds = [parseInt(permissions)];
        }
      }

      await RoleModel.updateRolePermissions(parseInt(role_id), permissionIds);
      res.redirect('/roles?success=Permissions assigned successfully');
    } catch (err) {
      console.error('Assign permissions error:', err);
      res.redirect('/roles?error=Failed to update role permissions');
    }
  }
};
