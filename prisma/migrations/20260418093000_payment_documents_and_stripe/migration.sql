-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paymentCapturedAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "paymentProvider" TEXT NOT NULL DEFAULT 'PAYPAL';
ALTER TABLE "Order" ADD COLUMN "paymentReference" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentState" TEXT NOT NULL DEFAULT 'Pending';
ALTER TABLE "Order" ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'USD';

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "amountCents" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "providerOrderId" TEXT,
    "providerSessionId" TEXT,
    "providerPaymentId" TEXT,
    "payerEmail" TEXT,
    "payerName" TEXT,
    "paymentMethodType" TEXT,
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "countryCode" TEXT,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Backfill
UPDATE "Order"
SET "paymentState" = 'Paid',
    "paymentCapturedAt" = "updatedAt"
WHERE "status" = 'Completed';

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_orderId_key" ON "PaymentRecord"("orderId");

-- CreateIndex
CREATE INDEX "PaymentRecord_createdAt_idx" ON "PaymentRecord"("createdAt");

-- CreateIndex
CREATE INDEX "PaymentRecord_provider_status_idx" ON "PaymentRecord"("provider", "status");