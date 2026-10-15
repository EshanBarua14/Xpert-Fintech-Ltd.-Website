-- Broker ranking on DSE / CSE, with as-of and source
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "dseRank" INTEGER;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "cseRank" INTEGER;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "rankAsOf" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "rankSource" TEXT;
