-- Add goal settings to stores table
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS daily_goal numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_goal numeric DEFAULT 0;