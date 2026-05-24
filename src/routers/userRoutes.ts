import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { checkPermission } from '../middleware/rbacMiddleware';

const router = Router();

// GET /users -> list all users (Requires user:view permission)
router.get('/', checkPermission('user:view'), UserController.listUsers);

// POST /users -> create a user (Requires user:create permission)
router.post('/', checkPermission('user:create'), UserController.storeUser);

// Supporting both DELETE (AJAX) and POST (HTML Form) for deleting users (Requires user:delete permission)
router.delete('/:id', checkPermission('user:delete'), UserController.removeUser);
router.post('/delete/:id', checkPermission('user:delete'), UserController.removeUser);

export default router;
