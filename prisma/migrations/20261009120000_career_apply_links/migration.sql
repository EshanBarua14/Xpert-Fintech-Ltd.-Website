-- A job's LinkedIn and Bdjobs postings and the email for applications; an "about" text per language.
ALTER TABLE "Career" ADD COLUMN IF NOT EXISTS "linkedinUrl" TEXT;
ALTER TABLE "Career" ADD COLUMN IF NOT EXISTS "bdjobsUrl" TEXT;
ALTER TABLE "Career" ADD COLUMN IF NOT EXISTS "applyEmail" TEXT;
ALTER TABLE "CareerTranslation" ADD COLUMN IF NOT EXISTS "about" TEXT;
