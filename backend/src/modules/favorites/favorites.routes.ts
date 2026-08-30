import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { toggle, list, ids } from './favorites.controller';

const router = Router();

router.use(requireAuth);

router.get('/', list);
router.get('/ids', ids);
router.post('/toggle', toggle);

export default router;
