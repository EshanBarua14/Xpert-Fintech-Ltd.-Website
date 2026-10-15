-- A video on a news story
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;

-- Videos in gallery albums (an album holds photos, videos or both)
ALTER TABLE "Video" ADD COLUMN IF NOT EXISTS "albumId" UUID;
CREATE INDEX IF NOT EXISTS "Video_albumId_idx" ON "Video"("albumId");
DO $$ BEGIN
  ALTER TABLE "Video" ADD CONSTRAINT "Video_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
