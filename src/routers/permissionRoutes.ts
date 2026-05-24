import { Router } from 'express';
import { PermissionController } from '../controllers/permissionController';
import { checkPermission } from '../middleware/rbacMiddleware';

const router = Router();

// GET /permissions -> list all permissions (Requires permission:view)
router.get('/', checkPermission('permission:view'), PermissionController.listPermissions);

// POST /permissions -> create a permission (Requires permission:create)
router.post('/', checkPermission('permission:create'), PermissionController.storePermission);

export default router;
