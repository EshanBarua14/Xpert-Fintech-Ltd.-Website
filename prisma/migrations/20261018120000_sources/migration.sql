-- A clickable source for news stories, events and success stories
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "sourceName" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
ALTER TABLE "CaseStudy" ADD COLUMN IF NOT EXISTS "sourceName" TEXT;
ALTER TABLE "CaseStudy" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
