import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/userModel';

// Extend Express Request types to support req.user and req.session typings
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role_id: number | null;
        role_name: string;
        permissions: string[];
      };
    }
  }
}

/**
 * Middleware to ensure the user is logged in.
 * If not authenticated, redirects to the login page.
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !(req.session as any).userId) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(401).json({ error: 'Unauthorized. Please login.' });
    }
    return res.redirect('/login');
  }
  next();
}

/**
 * Global middleware to load the user's latest permissions and data from the DB
 * using their session ID. Makes `req.user` and template variable `user` available on every request.
 */
export async function loadUser(req: Request, res: Response, next: NextFunction) {
  if (req.session && (req.session as any).userId) {
    try {
      const userWithPerms = await UserModel.getUserWithPermissions((req.session as any).userId);
      if (userWithPerms) {
        req.user = {
          id: userWithPerms.user.id!,
          username: userWithPerms.user.username,
          role_id: userWithPerms.user.role_id || null,
          role_name: userWithPerms.user.role_name || 'No Role',
          permissions: userWithPerms.permissions
        };
        res.locals.user = req.user; // Available in EJS templates automatically
      } else {
        // Session invalid: user deleted from database
        delete (req.session as any).userId;
        res.locals.user = null;
      }
    } catch (err) {
      console.error('Error loading user session:', err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
}

/**
 * RBAC authorization middleware to validate permissions.
 * Admins are automatically granted all permissions.
 */
export function checkPermission(requiredPermission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).redirect('/login');
    }

    const { role_name, permissions = [] } = req.user;

    // Admin role bypasses all permission checks
    if (role_name.toLowerCase() === 'admin') {
      return next();
    }

    // Check if the permission exists in the user's permission array
    if (permissions.includes(requiredPermission)) {
      return next();
    }

    // Access Forbidden - render elegant 403 page
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(403).json({ error: `Forbidden. Requires permission: ${requiredPermission}` });
    }
    
    return res.status(403).render('403', {
      requiredPermission,
      userPermissions: permissions
    });
  };
}
export default checkPermission;
