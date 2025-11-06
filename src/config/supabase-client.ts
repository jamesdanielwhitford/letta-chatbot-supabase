import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL) {
  throw new Error(
    'SUPABASE_URL is not set. Please add it to your .env file.'
  )
}

if (!SUPABASE_ANON_KEY) {
  throw new Error(
    'SUPABASE_ANON_KEY is not set. Please add it to your .env file.'
  )
}

// Create Supabase client with TypeScript support
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('Supabase client initialized')
