-- Add maintenance_mode column to stores table
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS maintenance_mode boolean NOT NULL DEFAULT false;