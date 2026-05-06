-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "intro_duration_months" INTEGER,
ADD COLUMN     "intro_end_date" TIMESTAMPTZ(6),
ADD COLUMN     "intro_price" BIGINT,
ADD COLUMN     "intro_trigger_type" VARCHAR(10);
