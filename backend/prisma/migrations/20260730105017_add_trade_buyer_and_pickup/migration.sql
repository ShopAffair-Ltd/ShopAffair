-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "buyerId" TEXT,
ADD COLUMN     "pickupAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pickupCode" TEXT;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
