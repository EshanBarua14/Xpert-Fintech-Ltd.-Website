-- Who owns a consortium house: the kind of parent and its name (the "who owns Xpert" showcase)
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "parentType" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "parentName" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "parentNameBn" TEXT;
