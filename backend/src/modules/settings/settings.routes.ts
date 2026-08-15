import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware';
import { getSettings, updateSetting, broadcast, getPromoCodes, addPromoCode, flipPromoCode, removePromoCode } from './settings.controller';

const router = Router();

// Public read - the frontend needs settings like 'broadcast_alert' and CMS
// text even for logged-out visitors on the landing page.
router.get('/', getSettings);

router.use(requireAuth, requireAdmin);
router.post('/', updateSetting);
router.post('/broadcast', broadcast);
router.get('/promo-codes', getPromoCodes);
router.post('/promo-codes', addPromoCode);
router.patch('/promo-codes/:promoId/toggle', flipPromoCode);
router.delete('/promo-codes/:promoId', removePromoCode);

export default router;