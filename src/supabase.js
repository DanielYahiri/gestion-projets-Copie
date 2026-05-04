import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zpthxybwvfxsydddqrzh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwdGh4eWJ3dmZ4c3lkZGRxcnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwODE4OTMsImV4cCI6MjA5MDY1Nzg5M30.XMhDfD-vL8Blad4YV2UBHckADM-IS27PYSFPJitwpvc'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storageKey: 'dataflow-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (url, options = {}) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      return fetch(url, { ...options, signal: options.signal ?? controller.signal })
        .finally(() => clearTimeout(timeoutId))
    }
  }
})