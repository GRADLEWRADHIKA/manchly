-- Make pan_number unique in users table
-- First, remove any duplicate pan_numbers (keep the first one, set others to NULL)
UPDATE "users" u1
SET "pan_number" = NULL
WHERE "pan_number" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "users" u2
    WHERE u2."pan_number" = u1."pan_number"
      AND u2.id < u1.id
  );

-- Create unique index on pan_number (allows NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS "users_pan_number_key" ON "users"("pan_number") WHERE "pan_number" IS NOT NULL;

