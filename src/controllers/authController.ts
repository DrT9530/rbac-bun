import { Request, Response } from 'express';
import { UserModel } from '../models/userModel';

export const AuthController = {
  // GET /login
  async showLogin(req: Request, res: Response) {
    if (req.session && (req.session as any).userId) {
      return res.redirect('/users');
    }
    const error = req.query.error as string;
    const success = req.query.success as string;
    res.render('login', { error, success });
  },

  // POST /login
  async login(req: Request, res: Response) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.redirect('/login?error=Please fill in all fields');
    }

    try {
      const user = await UserModel.getUserByUsername(username);

      if (!user || !user.password) {
        return res.redirect('/login?error=Invalid username or password');
      }

      // Verify the password using Bun's built-in verifier
      const isPasswordValid = await Bun.password.verify(password, user.password);

      if (!isPasswordValid) {
        return res.redirect('/login?error=Invalid username or password');
      }

      // Store user ID in session
      (req.session as any).userId = user.id;

      res.redirect('/users');
    } catch (err) {
      console.error('Login error:', err);
      res.redirect('/login?error=Internal server error');
    }
  },

  // GET /logout
  async logout(req: Request, res: Response) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.redirect('/login?success=Logged out successfully');
    });
  },

  // GET /auth/switch/:username (Useful helper for demonstrating / testing RBAC features)
  async switchUser(req: Request, res: Response) {
    const { username } = req.params;
    try {
      const user = await UserModel.getUserByUsername(username);
      if (user) {
        (req.session as any).userId = user.id;
        return res.redirect('back');
      }
      res.redirect('/login?error=User not found');
    } catch (err) {
      console.error('Switch user error:', err);
      res.redirect('/login?error=Internal error');
    }
  }
};
