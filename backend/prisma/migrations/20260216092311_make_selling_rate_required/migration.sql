/*
  Warnings:

  - Made the column `selling_rate` on table `sales_invoice_items` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "sales_invoice_items" ALTER COLUMN "selling_rate" SET NOT NULL;
