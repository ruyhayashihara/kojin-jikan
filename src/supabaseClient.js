import { createClient } from '@supabase/supabase-js';

// ⚠️ Substitua pelos dados do seu projeto Supabase
const SUPABASE_URL = 'https://jtcdtedyzvjhrzuzbjrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0Y2R0ZWR5enZqaHJ6dXpianJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzQyNTIsImV4cCI6MjA4NzMxMDI1Mn0.37xw85jnB_kX_D0995J1f0kxmi7TFKvtUf024NfzCVg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
