-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reset_token" VARCHAR(500),
ADD COLUMN     "reset_token_expires" TIMESTAMPTZ(6);
