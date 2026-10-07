-- AlterEnum
ALTER TYPE "VideoProvider" ADD VALUE 'FACEBOOK';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EntityType" ADD VALUE 'ALBUM';
ALTER TYPE "EntityType" ADD VALUE 'VIDEO';

-- CreateTable
CREATE TABLE "Album" (
    "id" UUID NOT NULL,
    "coverMediaId" UUID,
    "takenAt" TIMESTAMP(3),
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumTranslation" (
    "id" UUID NOT NULL,
    "albumId" UUID NOT NULL,
    "locale" "Locale" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "AlbumTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumMedia" (
    "id" UUID NOT NULL,
    "albumId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlbumMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" UUID NOT NULL,
    "provider" "VideoProvider" NOT NULL,
    "url" TEXT,
    "mediaId" UUID,
    "posterMediaId" UUID,
    "eventId" UUID,
    "recordedAt" TIMESTAMP(3),
    "durationSec" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoTranslation" (
    "id" UUID NOT NULL,
    "videoId" UUID NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "VideoTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Album_status_deletedAt_publishAt_idx" ON "Album"("status", "deletedAt", "publishAt");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumTranslation_albumId_locale_key" ON "AlbumTranslation"("albumId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumTranslation_locale_slug_key" ON "AlbumTranslation"("locale", "slug");

-- CreateIndex
CREATE INDEX "AlbumMedia_albumId_sortOrder_idx" ON "AlbumMedia"("albumId", "sortOrder");

-- CreateIndex
CREATE INDEX "Video_status_deletedAt_publishAt_idx" ON "Video"("status", "deletedAt", "publishAt");

-- CreateIndex
CREATE INDEX "Video_eventId_idx" ON "Video"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoTranslation_videoId_locale_key" ON "VideoTranslation"("videoId", "locale");

-- AddForeignKey
ALTER TABLE "AlbumTranslation" ADD CONSTRAINT "AlbumTranslation_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumMedia" ADD CONSTRAINT "AlbumMedia_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoTranslation" ADD CONSTRAINT "VideoTranslation_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
