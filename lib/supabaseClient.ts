import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// -----------------------------------------------------------------------------
// Supabase Project Configuration
// -----------------------------------------------------------------------------
// IMPORTANT: Replace with your Supabase project's URL and Anon Key.
// You can find these in your Supabase project's settings under "API".
// FIX: Added string type annotation to prevent TypeScript from inferring a narrow literal type,
// which causes an error when comparing against the placeholder value.
const supabaseUrl: string = 'https://aawgjmddbfdtdewfgjgn.supabase.co';
// FIX: Added string type annotation to prevent TypeScript from inferring a narrow literal type,
// which causes an error when comparing against the placeholder value.
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhd2dqbWRkYmZkdGRld2ZnamduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MzQ4NjksImV4cCI6MjA3NjAxMDg2OX0.cUZrLpsNvIfu36H9L9LBum1P1G-dSHdgvYH71mer75o';

// A helper to check if the credentials have been replaced.
const areCredentialsValid = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

// Create a single Supabase client for interacting with the backend.
// If credentials are not valid, the client will be null, and the app will use fallback data.
const supabase: SupabaseClient | null = areCredentialsValid
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  : null;

export { supabase };