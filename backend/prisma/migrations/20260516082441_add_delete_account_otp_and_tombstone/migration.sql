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
ALTER TABLE "cureli_mobile_users" ADD COLUMN     "delete_otp_expires" TIMESTAMPTZ(6),
ADD COLUMN     "delete_otp_hash" TEXT;

-- CreateTable
CREATE TABLE "cureli_mobile_deleted_accounts" (
    "id" UUID NOT NULL,
    "original_user_id" UUID NOT NULL,
    "phone_hash" VARCHAR(64) NOT NULL,
    "full_name" VARCHAR(200),
    "email" VARCHAR(255),
    "deletion_reason" VARCHAR(50) NOT NULL DEFAULT 'user_requested',
    "account_created_at" TIMESTAMPTZ(6) NOT NULL,
    "address_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cureli_mobile_deleted_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cureli_mobile_deleted_accounts_original_user_id_idx" ON "cureli_mobile_deleted_accounts"("original_user_id");

-- CreateIndex
CREATE INDEX "cureli_mobile_deleted_accounts_phone_hash_idx" ON "cureli_mobile_deleted_accounts"("phone_hash");

-- CreateIndex
CREATE INDEX "cureli_mobile_deleted_accounts_deleted_at_idx" ON "cureli_mobile_deleted_accounts"("deleted_at");

-- CreateIndex
CREATE INDEX "master_medicine_variants_manufacturer_idx" ON "master_medicine_variants"("manufacturer");

-- CreateIndex
CREATE INDEX "master_medicine_variants_marketer_idx" ON "master_medicine_variants"("marketer");
