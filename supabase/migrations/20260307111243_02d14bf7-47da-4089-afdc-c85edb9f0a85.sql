
ALTER TABLE public.prayer_groups ADD COLUMN slug text UNIQUE;

-- Backfill existing groups with slugs based on their name
UPDATE public.prayer_groups SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 8);

-- Make slug NOT NULL after backfill
ALTER TABLE public.prayer_groups ALTER COLUMN slug SET NOT NULL;
