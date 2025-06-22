import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (voor client components)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Browser client helper (voor client components)
export const createBrowserClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}