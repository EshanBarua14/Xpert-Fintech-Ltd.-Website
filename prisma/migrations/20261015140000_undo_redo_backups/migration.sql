-- Undo / redo stack on revisions
ALTER TABLE "Revision" ADD COLUMN IF NOT EXISTS "undoOf" UUID;
ALTER TABLE "Revision" ADD COLUMN IF NOT EXISTS "undoneAt" TIMESTAMP(3);
ALTER TABLE "Revision" ADD COLUMN IF NOT EXISTS "redoneAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Revision_actorId_createdAt_idx" ON "Revision"("actorId", "createdAt");

-- Full-content backups
CREATE TABLE IF NOT EXISTS "Backup" (
    "id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "counts" JSONB NOT NULL,
    "data" BYTEA NOT NULL,
    "actorId" UUID,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Backup_createdAt_idx" ON "Backup"("createdAt");
