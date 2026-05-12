-- Migration: add_trgm_indexes
-- Adds pg_trgm extension and GIN trigram indexes on
-- master_medicine_variants for fast ILIKE search.
--
-- pg_trgm is available on all AWS RDS PostgreSQL instances.
-- GIN indexes do not lock the table for reads during build.
-- Estimated build time on 658k rows: 2-5 minutes.
--
-- This migration is NON-DESTRUCTIVE. No data is changed.
-- Safe to run on production via: npx prisma migrate deploy

-- Step 1: Enable trigram extension (requires rds_superuser or superuser)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Step 2: GIN trigram index on variant name
-- Enables fast ILIKE '%term%' on master_medicine_variants.name
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mmv_name_trgm
  ON master_medicine_variants
  USING GIN (name gin_trgm_ops);

-- Step 3: GIN trigram index on variant brand
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mmv_brand_trgm
  ON master_medicine_variants
  USING GIN (brand gin_trgm_ops);

-- Step 4: GIN trigram index on manufacturer
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mmv_manufacturer_trgm
  ON master_medicine_variants
  USING GIN (manufacturer gin_trgm_ops);

-- Step 5: GIN trigram index on marketer
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mmv_marketer_trgm
  ON master_medicine_variants
  USING GIN (marketer gin_trgm_ops);

-- Step 6: GIN trigram index on master_medicines generic_name
-- Used in the fallback Query 5 in findPotentialMatches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mm_generic_name_trgm
  ON master_medicines
  USING GIN (generic_name gin_trgm_ops);