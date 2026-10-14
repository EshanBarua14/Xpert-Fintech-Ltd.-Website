-- Copies of records taken before an admin changes or deletes them (Admin → History, undo).
CREATE TABLE IF NOT EXISTS "Revision" (
    "id" UUID NOT NULL,
    "model" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "label" TEXT,
    "snapshot" JSONB NOT NULL,
    "actorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Revision_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Revision_model_entityId_createdAt_idx" ON "Revision"("model", "entityId", "createdAt");
CREATE INDEX IF NOT EXISTS "Revision_createdAt_idx" ON "Revision"("createdAt");
