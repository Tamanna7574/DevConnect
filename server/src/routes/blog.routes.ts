import { Router } from 'express';
import { BlogController } from '../controllers/blog.controller.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';
import { uploadImage } from '../middlewares/upload.middleware.js';

const router = Router();

router.get('/', BlogController.listBlogs);
router.get('/my/posts', requireAuth, BlogController.listMyBlogs);
router.get('/:idOrSlug', optionalAuth, BlogController.getBlog);
router.post('/', requireAuth, uploadImage.single('coverImage'), BlogController.createBlog);
router.put('/:id', requireAuth, uploadImage.single('coverImage'), BlogController.updateBlog);
router.delete('/:id', requireAuth, BlogController.deleteBlog);

export default router;
