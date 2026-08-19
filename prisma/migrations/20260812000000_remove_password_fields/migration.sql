-- Make password_hash nullable (users authenticate via Google OAuth)
ALTER TABLE "usuarios" ALTER COLUMN "password_hash" DROP NOT NULL;

-- Drop primera_vez column (no longer needed without password-based login)
ALTER TABLE "usuarios" DROP COLUMN "primera_vez";
