-- AlterTable
ALTER TABLE "User" ADD COLUMN     "paystackCustomerCode" TEXT,
ADD COLUMN     "paystackRecipientCode" TEXT,
ADD COLUMN     "withdrawalAccountName" TEXT,
ADD COLUMN     "withdrawalAccountNumber" TEXT,
ADD COLUMN     "withdrawalBankCode" TEXT,
ADD COLUMN     "withdrawalBankName" TEXT;
