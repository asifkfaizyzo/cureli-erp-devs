/*
  Warnings:

  - You are about to drop the column `onboarding_step` on the `shops` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "shops" DROP COLUMN "onboarding_step";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboarding_step" INTEGER NOT NULL DEFAULT 4;
