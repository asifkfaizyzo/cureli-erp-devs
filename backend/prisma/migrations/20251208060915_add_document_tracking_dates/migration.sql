-- AlterTable
ALTER TABLE "shop_files" ADD COLUMN     "last_resubmitted_at" TIMESTAMPTZ(6),
ADD COLUMN     "rejected_at" TIMESTAMPTZ(6);
