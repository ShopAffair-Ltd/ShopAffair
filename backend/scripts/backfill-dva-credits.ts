import { prisma } from '../src/config/db';
import { creditWalletFromDvaWebhook } from '../src/modules/payments/payments.service';

interface BackfillEntry {
  reference: string;
  amountKobo: number;
  receiverAccountNumber: string;
}

const ENTRIES: BackfillEntry[] = [
  { reference: '1000042608210913031688826697O8', amountKobo: 15000, receiverAccountNumber: '9816393340' },
];

const run = async () => {
  if (ENTRIES.length === 0) {
    console.log('No entries to backfill. Fill in the ENTRIES array with data from your Paystack dashboard.');
    return;
  }

  for (const entry of ENTRIES) {
    console.log(`Processing ${entry.reference}...`);

    const result = await creditWalletFromDvaWebhook({
      reference: entry.reference,
      amountKobo: entry.amountKobo,
      receiverAccountNumber: entry.receiverAccountNumber
    });

    if (result) {
      console.log(`  Credited ₦${(entry.amountKobo / 100).toLocaleString()} for reference ${entry.reference}`);
    } else {
      console.log(`  Skipped ${entry.reference} - already credited, or no matching user found for account ${entry.receiverAccountNumber}. Check the logs above for details.`);
    }
  }

  console.log('Backfill complete.');
};

run()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });