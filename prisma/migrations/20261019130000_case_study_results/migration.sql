-- Key results of a success story, shown large on its card and page
ALTER TABLE "CaseStudy" ADD COLUMN IF NOT EXISTS "results" JSONB;
