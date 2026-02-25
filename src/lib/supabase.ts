import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://fhkhamwrfwtacwydukvb.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxenh6dXFzaHRrdXptanBveHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTUxMTMsImV4cCI6MjA3NzA5MTExM30.hoU3Gw4bLdeX5p5QI8UjU9YDzusm84Yvk2eGn6JLb20';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
