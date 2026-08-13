import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://ncsuwmqdsawvbnbprfos.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jc3V3bXFkc2F3dmJuYnByZm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MDUwMjgsImV4cCI6MjEwMjE4MTAyOH0.rs9KgTgq-9q2IqzmOfj3ADDsp5YZnwR7CWh3YrDV-90';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
