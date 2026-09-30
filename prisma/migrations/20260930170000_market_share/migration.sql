-- CreateEnum
CREATE TYPE "MarketExchange" AS ENUM ('DSE', 'CSE');

-- CreateTable
CREATE TABLE "MarketShare" (
    "id" UUID NOT NULL,
    "tradeDate" DATE NOT NULL,
    "exchange" "MarketExchange" NOT NULL,
    "xpertTurnover" DECIMAL(20,2) NOT NULL,
    "marketTurnover" DECIMAL(20,2) NOT NULL,
    "sourceNote" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketShare_tradeDate_exchange_key" ON "MarketShare"("tradeDate", "exchange");
