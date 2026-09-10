import { Router } from 'express';
import { DiscoveryController } from '../controllers/discovery.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/developers', optionalAuth, DiscoveryController.searchDevelopers);
router.get('/search', optionalAuth, DiscoveryController.globalSearch);
router.get('/filters', DiscoveryController.getFilters);

export default router;
