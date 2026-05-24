import express from 'express';
import session from 'express-session';
import path from 'path';
import dotenv from 'dotenv';

import { initDatabase } from './config/database';
import { AuthController } from './controllers/authController';
import { isAuthenticated, loadUser } from './middleware/rbacMiddleware';

import userRoutes from './routers/userRoutes';
import roleRoutes from './routers/roleRoutes';
import rolePermissionRoutes from './routers/roleRoutes';
import permissionRoutes from './routers/permissionRoutes';

// Load environment configurations
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Views and EJS engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Expose static directory
app.use(express.static(path.join(__dirname, '../public')));

// Set up parsing middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up Express session
app.use(session({
  secret: process.env.SESSION_SECRET || 'rbac_system_default_secret_key_987654321',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if running over HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Load the dynamic session-user populator on every request
app.use(loadUser);

// Core Authentication & Demo routes
app.get('/login', AuthController.showLogin);
app.post('/login', AuthController.login);
app.get('/logout', AuthController.logout);
app.get('/auth/switch/:username', AuthController.switchUser);

// Main Administrative Modules (Guarded by isAuthenticated)
app.use('/users', isAuthenticated, userRoutes);
app.use('/roles', isAuthenticated, roleRoutes);
app.use('/permissions', isAuthenticated, permissionRoutes);

// Base Route redirector
app.get('/', (req, res) => {
  res.redirect('/users');
});

// 404 Fallback page
app.use((req, res) => {
  res.status(404).render('403', {
    requiredPermission: 'Any valid system route',
    userPermissions: req.user ? req.user.permissions : []
  });
});

// Self-healing database connection & Server Startup
async function bootstrap() {
  try {
    // Run DB schema and seeding
    await initDatabase();
    
    // Start Listening
    app.listen(PORT, () => {
      console.log(`🚀 SentryRBAC Server successfully loaded in Bun environment!`);
      console.log(`📡 URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Critical system bootstrap failure:', error);
    process.exit(1);
  }
}

bootstrap();
