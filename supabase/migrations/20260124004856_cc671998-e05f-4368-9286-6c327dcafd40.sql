-- Add label_color column to stores table
ALTER TABLE public.stores 
ADD COLUMN label_color TEXT DEFAULT '#9333EA';