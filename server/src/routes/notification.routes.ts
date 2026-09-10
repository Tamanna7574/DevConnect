import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, NotificationController.listNotifications);
router.put('/read-all', requireAuth, NotificationController.markAllAsRead);
router.put('/:id/read', requireAuth, NotificationController.markAsRead);

export default router;
