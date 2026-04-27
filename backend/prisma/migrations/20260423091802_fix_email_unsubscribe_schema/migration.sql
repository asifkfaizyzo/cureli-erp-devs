/*
  Warnings:

  - You are about to drop the column `shop_id` on the `email_unsubscribes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "email_unsubscribes" DROP COLUMN "shop_id",
ADD COLUMN     "cadmin_id" UUID,
ADD COLUMN     "token" VARCHAR(255),
ALTER COLUMN "reason" SET DATA TYPE VARCHAR(500);
