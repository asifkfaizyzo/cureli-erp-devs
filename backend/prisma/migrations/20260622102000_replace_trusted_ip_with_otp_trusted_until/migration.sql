/*
  Warnings:

  - You are about to drop the `user_trusted_ips` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_trusted_ips" DROP CONSTRAINT "user_trusted_ips_user_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "otp_trusted_until" TIMESTAMPTZ(6);

-- DropTable
DROP TABLE "user_trusted_ips";
