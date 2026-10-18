-- A personal or organisational website for a person (an icon on their card, beside email and LinkedIn)
ALTER TABLE "Person" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;
