-- Create table for getting started progress
CREATE TABLE public.getting_started_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  step_key text NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, step_key)
);

-- Create table to track if user has hidden the guide
CREATE TABLE public.getting_started_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.getting_started_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.getting_started_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for getting_started_progress
CREATE POLICY "Users can view own progress"
ON public.getting_started_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
ON public.getting_started_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
ON public.getting_started_progress
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for getting_started_settings
CREATE POLICY "Users can view own settings"
ON public.getting_started_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
ON public.getting_started_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON public.getting_started_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_getting_started_settings_updated_at
BEFORE UPDATE ON public.getting_started_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();