/**
 * Supabase client configuration
 * This file initializes the Supabase client with the appropriate configuration
 */
import { createClient } from '@supabase/supabase-js';

// These would typically come from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate that the required environment variables are set
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

// Create a single instance of the Supabase client to reuse
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true, // Enable auto refresh for more reliable session handling
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Log supabase initialization for debugging
console.log('Supabase client initialized with URL:', SUPABASE_URL);

// Export a default instance for ease of importing
export default supabase;
