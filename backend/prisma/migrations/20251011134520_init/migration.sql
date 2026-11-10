-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('USER', 'CREATOR', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "user_type" "UserType" NOT NULL DEFAULT 'USER';
