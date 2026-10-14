-- Uploaded files kept in the database (STORAGE_DRIVER=database; the default on Vercel).
CREATE TABLE IF NOT EXISTS "StoredFile" (
    "key" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("key")
);
