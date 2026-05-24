import { Request, Response } from 'express';
import { UserModel } from '../models/userModel';
import { RoleModel } from '../models/roleModel';

export const UserController = {
  // GET /users (Permission: user:view)
  async listUsers(req: Request, res: Response) {
    try {
      const users = await UserModel.getAllUsers();
      const roles = await RoleModel.getAllRoles();
      
      const error = req.query.error as string;
      const success = req.query.success as string;
      
      res.render('users/index', {
        users,
        roles,
        error,
        success,
        title: 'User Management'
      });
    } catch (err) {
      console.error('List users error:', err);
      res.status(500).send('Internal Server Error');
    }
  },

  // POST /users (Permission: user:create)
  async storeUser(req: Request, res: Response) {
    const { username, password, role_id } = req.body;

    if (!username || !password) {
      return res.redirect('/users?error=Username and Password are required');
    }

    try {
      // Check if user already exists
      const existingUser = await UserModel.getUserByUsername(username);
      if (existingUser) {
        return res.redirect('/users?error=Username already taken');
      }

      // Hash password using Bun's built-in verifier
      const hashedPassword = await Bun.password.hash(password, {
        algorithm: 'bcrypt',
        cost: 10
      });

      await UserModel.createUser({
        username,
        password: hashedPassword,
        role_id: role_id ? parseInt(role_id) : null
      });

      res.redirect('/users?success=User created successfully');
    } catch (err) {
      console.error('Create user error:', err);
      res.redirect('/users?error=Failed to create user');
    }
  },

  // DELETE /users/:id or POST /users/delete/:id (Permission: user:delete)
  async removeUser(req: Request, res: Response) {
    const { id } = req.params;

    if (!id) {
      return res.redirect('/users?error=User ID is required');
    }

    try {
      // Prevent users from deleting themselves
      if (req.user && req.user.id === parseInt(id)) {
        return res.redirect('/users?error=You cannot delete your own account');
      }

      await UserModel.deleteUser(parseInt(id));
      res.redirect('/users?success=User deleted successfully');
    } catch (err) {
      console.error('Delete user error:', err);
      res.redirect('/users?error=Failed to delete user');
    }
  }
};
