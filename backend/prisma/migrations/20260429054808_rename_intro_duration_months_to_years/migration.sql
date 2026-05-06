/*
  Warnings:

  - You are about to drop the column `intro_duration_months` on the `plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "plans" DROP COLUMN "intro_duration_months",
ADD COLUMN     "intro_duration_years" INTEGER;
