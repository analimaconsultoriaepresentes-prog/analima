-- Add sound_enabled setting to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS sound_enabled boolean NOT NULL DEFAULT false;