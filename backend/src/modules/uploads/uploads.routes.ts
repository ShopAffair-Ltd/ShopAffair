import { Router } from 'express';
import { uploadTradeImage } from './uploads.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { uploadImage } from '../../middleware/upload.middleware';

const router = Router();

router.post('/image', requireAuth, uploadImage.single('image'), uploadTradeImage);

export default router;