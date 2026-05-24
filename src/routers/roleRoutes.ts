import { Router } from 'express';
import { RoleController } from '../controllers/roleController';
import { checkPermission } from '../middleware/rbacMiddleware';

const router = Router();

// GET /roles -> list roles & assignments (Requires role:view permission)
router.get('/', checkPermission('role:view'), RoleController.listRoles);

// POST /roles -> create a new role (Requires role:create permission)
router.post('/', checkPermission('role:create'), RoleController.storeRole);

// POST /roles/assign -> assign permissions to role (Requires role:edit permission)
router.post('/assign', checkPermission('role:edit'), RoleController.assignPermissions);

export default router;
