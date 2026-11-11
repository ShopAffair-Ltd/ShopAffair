import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  fundWallet,
  verifyFunding,
  generateVirtualAccount,
  getTransactions,
  getBalance,
  getBanks,
  resolveAccount,
  resolveAccountAllBanks,
  withdraw,
  subscribe,
  getSubscription,
  getPlans,
  redeemPromo,
  p2pTransfer
} from './payments.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

const fundingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many funding attempts, please try again later' }
});

const withdrawalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many withdrawal attempts, please try again later' }
});

const redeemLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many promo code attempts, please try again later' }
});

router.get('/wallet/balance', requireAuth, getBalance);
router.get('/wallet/transactions', requireAuth, getTransactions);
router.post('/wallet/fund', requireAuth, fundingLimiter, fundWallet);
router.get('/wallet/verify', requireAuth, verifyFunding);
router.post('/wallet/virtual-account', requireAuth, fundingLimiter, generateVirtualAccount);
router.get('/wallet/banks', requireAuth, getBanks);
router.post('/wallet/resolve-account', requireAuth, resolveAccount);
// Same account-number-to-bank auto-detect used on signup (see
// /auth/register/resolve-account), exposed here for withdrawal so the user
// doesn't have to manually search for and pick their bank.
router.post('/wallet/resolve-account-all-banks', requireAuth, resolveAccountAllBanks);
router.post('/wallet/withdraw', requireAuth, withdrawalLimiter, withdraw);
router.post('/wallet/p2p-transfer', requireAuth, withdrawalLimiter, p2pTransfer);
router.get('/subscription', requireAuth, getSubscription);
router.post('/subscription', requireAuth, subscribe);
router.get('/plans', getPlans);
router.post('/promo/redeem', requireAuth, redeemLimiter, redeemPromo);

export default router;