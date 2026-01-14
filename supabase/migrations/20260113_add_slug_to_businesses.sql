-- Add slug column
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS slug text;

-- Update existing records: Simple slugify first
UPDATE public.businesses
SET slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Handle duplicates: Append suffix to duplicates
WITH duplicates AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM public.businesses
)
UPDATE public.businesses
SET slug = public.businesses.slug || '-' || duplicates.rn
FROM duplicates
WHERE public.businesses.id = duplicates.id
AND duplicates.rn > 1;

-- Now add the constraint
ALTER TABLE public.businesses ADD CONSTRAINT businesses_slug_key UNIQUE (slug);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses (slug);
