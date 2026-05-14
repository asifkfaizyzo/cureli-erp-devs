After running prisma migrate deploy or prisma migrate dev on a fresh database,
run the following manually in psql to create trigram indexes:

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_mmv_name_trgm ON master_medicine_variants USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_mmv_brand_trgm ON master_medicine_variants USING GIN (brand gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_mmv_manufacturer_trgm ON master_medicine_variants USING GIN (manufacturer gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_mmv_marketer_trgm ON master_medicine_variants USING GIN (marketer gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_mm_generic_name_trgm ON master_medicines USING GIN (generic_name gin_trgm_ops);