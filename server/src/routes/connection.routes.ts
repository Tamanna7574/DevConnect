import { Router } from 'express';
import { ConnectionController } from '../controllers/connection.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/request', requireAuth, ConnectionController.sendRequest);
router.put('/:id/respond', requireAuth, ConnectionController.respondRequest);
router.delete('/:id', requireAuth, ConnectionController.removeConnection);
router.get('/', requireAuth, ConnectionController.listConnections);

export default router;
