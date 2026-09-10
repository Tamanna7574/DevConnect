import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import projectRoutes from './project.routes.js';
import blogRoutes from './blog.routes.js';
import discoveryRoutes from './discovery.routes.js';
import connectionRoutes from './connection.routes.js';
import endorsementRoutes from './endorsement.routes.js';
import notificationRoutes from './notification.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/blogs', blogRoutes);
router.use('/discovery', discoveryRoutes);
router.use('/connections', connectionRoutes);
router.use('/endorsements', endorsementRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
