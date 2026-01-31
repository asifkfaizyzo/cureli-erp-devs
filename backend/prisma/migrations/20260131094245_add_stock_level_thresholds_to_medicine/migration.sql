-- AlterTable
ALTER TABLE "medicines" ADD COLUMN     "max_stock_level" DECIMAL(10,2),
ADD COLUMN     "min_stock_level" DECIMAL(10,2),
ADD COLUMN     "reorder_point" DECIMAL(10,2);
