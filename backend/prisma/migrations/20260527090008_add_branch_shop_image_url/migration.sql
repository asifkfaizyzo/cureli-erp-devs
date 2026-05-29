-- DropIndex
DROP INDEX "idx_mmv_brand_trgm";

-- DropIndex
DROP INDEX "idx_mmv_manufacturer_trgm";

-- DropIndex
DROP INDEX "idx_mmv_marketer_trgm";

-- DropIndex
DROP INDEX "idx_mmv_name_trgm";

-- DropIndex
DROP INDEX "idx_mm_generic_name_trgm";

-- AlterTable
ALTER TABLE "branch_marketplace_settings" ADD COLUMN     "shop_image_url" VARCHAR(500);
