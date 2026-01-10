/*
  Warnings:

  - Changed the column `user_type` on the `users` table from a scalar field to a list field. If there are non-null values in that column, this step will fail.

*/
-- Step 1: Add a temporary column with array type
ALTER TABLE "users" ADD COLUMN "user_type_new" "UserType"[] DEFAULT ARRAY['USER']::"UserType"[];

-- Step 2: Convert existing single enum values to arrays in the new column
UPDATE "users" SET "user_type_new" = ARRAY["user_type"]::"UserType"[] WHERE "user_type" IS NOT NULL;

-- Step 3: Drop the old column
ALTER TABLE "users" DROP COLUMN "user_type";

-- Step 4: Rename the new column to the original name
ALTER TABLE "users" RENAME COLUMN "user_type_new" TO "user_type";
