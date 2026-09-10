import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';
import { uploadImage } from '../middlewares/upload.middleware.js';

const router = Router();

router.get('/', optionalAuth, ProjectController.listProjects);
router.get('/user/:userId', optionalAuth, ProjectController.listUserProjects);
router.get('/:id', optionalAuth, ProjectController.getProject);
router.post('/', requireAuth, uploadImage.single('image'), ProjectController.createProject);
router.put('/:id', requireAuth, uploadImage.single('image'), ProjectController.updateProject);
router.delete('/:id', requireAuth, ProjectController.deleteProject);

export default router;
