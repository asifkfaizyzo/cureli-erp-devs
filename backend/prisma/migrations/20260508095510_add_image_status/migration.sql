-- AlterTable
ALTER TABLE "master_medicines" ADD COLUMN     "image_status" VARCHAR(10) NOT NULL DEFAULT 'NONE';

-- CreateIndex
CREATE INDEX "master_medicines_image_status_idx" ON "master_medicines"("image_status");
