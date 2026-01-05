-- Add column for showing photos in sales screen
ALTER TABLE public.stores 
ADD COLUMN show_photos_in_sales boolean NOT NULL DEFAULT true;