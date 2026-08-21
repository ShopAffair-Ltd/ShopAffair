import { Router, type Request, type Response } from 'express';
import express from 'express';
import crypto from 'crypto';
import { env } from '../../config/env';
import { creditWalletFromWebhook, creditWalletFromDvaWebhook, handleTransferWebhookEvent } from './payments.service';

const router = Router();

interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
    status: string;
    channel?: string;
    metadata?: {
      receiver_account_number?: string;
      receiver_bank?: string;
    };
  };
}

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

    res.status(200).json({ received: true });

    void (async () => {
      try {
        const event = JSON.parse(rawBody.toString('utf-8')) as PaystackWebhookEvent;

        if (event.event === 'charge.success' && event.data.channel === 'dedicated_nuban') {
          await creditWalletFromDvaWebhook({
            reference: event.data.reference,
            amountKobo: event.data.amount,
            receiverAccountNumber: event.data.metadata?.receiver_account_number
          });
        } else if (event.event === 'charge.success') {
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