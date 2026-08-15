import { Router } from 'express';
import * as wallPostsController from './wallPosts.controller';
import { requireAuth, optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

router.get('/:username/wall', optionalAuth, wallPostsController.listWallPosts);
router.post('/wall', requireAuth, wallPostsController.createWallPost);
router.delete('/wall/:postId', requireAuth, wallPostsController.deleteWallPost);
router.patch('/wall/:postId/pin', requireAuth, wallPostsController.togglePin);
router.post('/wall/:postId/like', requireAuth, wallPostsController.toggleLike);
router.post('/wall/:postId/comments', requireAuth, wallPostsController.addComment);

export default router;