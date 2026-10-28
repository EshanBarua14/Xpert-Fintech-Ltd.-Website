-- Admin roles: ADMIN (full rights, every existing account) and EDITOR (edits existing content only).
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'EDITOR');
ALTER TABLE "AdminUser" ADD COLUMN "role" "AdminRole" NOT NULL DEFAULT 'ADMIN';
