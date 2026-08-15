import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware';
import { getPendingCommunities, approvePendingCommunity, rejectPendingCommunity, freeze, unfreeze, getFrozenUsers, unpauseTrade, getPendingKycList, approveKycUser, rejectKycUser, getAuditLogs, getDashboard, getAllProducts, removeProduct, getAllReviews, removeReview, getAllOrders, getVendors, getCategories, getHealth } from './admin.controller';
import { getAllWithdrawals, getAllTransactions } from '../payments/payments.controller';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/dashboard', getDashboard);
router.get('/communities/pending', getPendingCommunities);
router.post('/communities/:chatRoomId/approve', approvePendingCommunity);
router.post('/communities/:chatRoomId/reject', rejectPendingCommunity);
router.get('/users/frozen', getFrozenUsers);
router.post('/users/:userId/freeze', freeze);
router.post('/users/:userId/unfreeze', unfreeze);
router.post('/trades/:tradeId/resume', unpauseTrade);
router.get('/kyc/pending', getPendingKycList);
router.post('/kyc/:userId/approve', approveKycUser);
router.post('/kyc/:userId/reject', rejectKycUser);
router.get('/audit-logs', getAuditLogs);
router.get('/withdrawals', getAllWithdrawals);
router.get('/transactions', getAllTransactions);
router.get('/products', getAllProducts);
router.delete('/products/:productId', removeProduct);
router.get('/reviews', getAllReviews);
router.delete('/reviews/:reviewId', removeReview);
router.get('/orders', getAllOrders);
router.get('/vendors', getVendors);
router.get('/categories', getCategories);
router.get('/health', getHealth);

export default router;