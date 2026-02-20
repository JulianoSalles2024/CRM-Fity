// services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// TODO: Replace with your project's credentials
const supabaseUrl = 'https://fqzxzuqshtkuzmjpoxsg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxenh6dXFzaHRrdXptanBveHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTUxMTMsImV4cCI6MjA3NzA5MTExM30.hoU3Gw4bLdeX5p5QI8UjU9YDzusm84Yvk2eGn6JLb20'

// The original check was inverted. This corrected version ensures the app loads
// now that you've added your credentials.
export const isSupabaseConfigured = 
  !!supabaseUrl && !!supabaseAnonKey;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
