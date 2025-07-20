import { createClient } from '@supabase/supabase-js'

// These should be moved to environment variables in production
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://pdclhqsvfyecyezftydr.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkY2xocXN2ZnllY3llemZ0eWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NjQxNjIsImV4cCI6MjA2ODU0MDE2Mn0.82aG1bHlvNp9YK-spOuKowwhb4fH_sW0MzQw7kOBxMQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Disable auth for this MVP - we'll add authentication later if needed
    persistSession: false,
  },
})
