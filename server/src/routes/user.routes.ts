import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';
import { uploadImage } from '../middlewares/upload.middleware.js';

const router = Router();

router.get('/profile/:username', optionalAuth, UserController.getProfile);
router.put('/profile', requireAuth, UserController.updateProfile);
router.post('/avatar', requireAuth, uploadImage.single('avatar'), UserController.uploadAvatar);
router.post('/skills', requireAuth, UserController.addSkill);
router.delete('/skills/:skillId', requireAuth, UserController.removeSkill);

export default router;
