import { Request, Response } from 'express';
import { PermissionModel } from '../models/permissionModel';

export const PermissionController = {
  // GET /permissions (Permission: permission:view or similar)
  async listPermissions(req: Request, res: Response) {
    try {
      const permissions = await PermissionModel.getAllPermissions();
      
      const error = req.query.error as string;
      const success = req.query.success as string;

      res.render('permissions/index', {
        permissions,
        error,
        success,
        title: 'Permission Management'
      });
    } catch (err) {
      console.error('List permissions error:', err);
      res.status(500).send('Internal Server Error');
    }
  },

  // POST /permissions (Permission: permission:create)
  async storePermission(req: Request, res: Response) {
    const { resource, action } = req.body;

    if (!resource || !action) {
      return res.redirect('/permissions?error=Resource and Action are required');
    }

    try {
      // Format permission name, e.g. "user:create"
      const resourceFormatted = resource.trim().toLowerCase();
      const actionFormatted = action.trim().toLowerCase();
      const name = `${resourceFormatted}:${actionFormatted}`;

      // Check duplicates
      const permissions = await PermissionModel.getAllPermissions();
      if (permissions.some(p => p.name === name)) {
        return res.redirect('/permissions?error=Permission already exists');
      }

      await PermissionModel.createPermission({
        name,
        resource: resourceFormatted,
        action: actionFormatted
      });

      res.redirect('/permissions?success=Permission created successfully');
    } catch (err) {
      console.error('Create permission error:', err);
      res.redirect('/permissions?error=Failed to create permission');
    }
  }
};
