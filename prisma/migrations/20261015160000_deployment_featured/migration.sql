-- A featured branded app, shown large above the others
ALTER TABLE "Deployment" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
