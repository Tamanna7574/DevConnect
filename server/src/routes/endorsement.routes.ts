import { Router } from 'express';
import { EndorsementController } from '../controllers/endorsement.controller.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', requireAuth, EndorsementController.endorseSkill);
router.delete('/:userSkillId', requireAuth, EndorsementController.removeEndorsement);
router.get('/skill/:userSkillId', optionalAuth, EndorsementController.listEndorsers);

export default router;
