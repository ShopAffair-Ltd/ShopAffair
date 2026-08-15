import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware';
import { create, listMine, listAll, reply, setStatus } from './support.controller';

const router = Router();

router.post('/', requireAuth, create);
router.get('/mine', requireAuth, listMine);
router.post('/:ticketId/reply', requireAuth, reply);

router.get('/', requireAuth, requireAdmin, listAll);
router.patch('/:ticketId/status', requireAuth, requireAdmin, setStatus);

export default router;