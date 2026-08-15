/*
  Warnings:

  - A unique constraint covering the columns `[tradeId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderRef` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "deliveryFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "orderRef" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "tradeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_tradeId_key" ON "Order"("tradeId");

-- CreateIndex
CREATE INDEX "Order_orderRef_idx" ON "Order"("orderRef");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
