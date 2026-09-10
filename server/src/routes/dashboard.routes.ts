import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, DashboardController.getDashboard);

export default router;
