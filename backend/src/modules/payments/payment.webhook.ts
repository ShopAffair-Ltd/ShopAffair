import { Router, type Request, type Response } from 'express';
import express from 'express';
import crypto from 'crypto';
import { env } from '../../config/env';
import { creditWalletFromWebhook, handleTransferWebhookEvent } from './payments.service';

const router = Router();

interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
    status: string;
  };
}

// Paystack signs the raw request body with your secret key (HMAC SHA512) and
// sends it in the x-paystack-signature header. This MUST be verified before
// trusting anything in the payload - without it, anyone who finds this URL
// could POST a fake "payment succeeded" event and credit their own wallet.
// Requires the raw (unparsed) body, hence express.raw() here instead of
// relying on the app-level express.json() middleware.
router.post(
  '/paystack',
  express.raw({ type: 'application/json' }),
  (req: Request, res: Response) => {
    const signature = req.headers['x-paystack-signature'];
    const rawBody = req.body as Buffer;

    if (typeof signature !== 'string' || !rawBody) {
      res.status(400).json({ message: 'Missing signature or body' });
      return;
    }

    const expectedSignature = crypto
      .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      res.status(401).json({ message: 'Invalid signature' });
      return;
    }

    // Respond 200 immediately so Paystack doesn't retry unnecessarily, then
    // process asynchronously. Errors here are logged, not thrown, since a
    // thrown error after headers might otherwise get retried infinitely.
    res.status(200).json({ received: true });

    void (async () => {
      try {
        const event = JSON.parse(rawBody.toString('utf-8')) as PaystackWebhookEvent;

        if (event.event === 'charge.success') {
          await creditWalletFromWebhook(event.data.reference, event.data.amount);
        } else if (
          event.event === 'transfer.success' ||
          event.event === 'transfer.failed' ||
          event.event === 'transfer.reversed'
        ) {
          await handleTransferWebhookEvent(event.event, event.data.reference);
        }
      } catch (err) {
        console.error('Paystack webhook processing failed:', err);
      }
    })();
  }
);

export default router;