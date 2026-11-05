ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "visibility" "ProductVisibility"
NOT NULL DEFAULT 'MARKET';