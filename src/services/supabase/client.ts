import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://polyjkevdswpsllcgtsk.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbHlqa2V2ZHN3cHNsbGNndHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxODY1ODgsImV4cCI6MjEwMjc2MjU4OH0.EvvSmspMfD1UcG3_-tFqp1xf_t6kvmxpa0fzQDOiOMU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
