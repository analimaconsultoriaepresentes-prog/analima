-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily summary email at 20:00 Brazil time (23:00 UTC)
SELECT cron.schedule(
  'send-daily-summary-email',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sytmmkzlhylgdtwhjwkn.supabase.co/functions/v1/send-daily-summary',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dG1ta3psaHlsZ2R0d2hqd2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NjAxNDIsImV4cCI6MjA4MjQzNjE0Mn0.VLJMVL84K9pNywLqbjyhAOxcwPUTXbWtiovCulDTlHc"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);