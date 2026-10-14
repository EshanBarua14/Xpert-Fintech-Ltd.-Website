-- Stock exchange membership (TREC) numbers of brokerage houses.
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "dseTrec" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "cseTrec" TEXT;
