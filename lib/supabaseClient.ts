import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ndeijwxhcsocmyahnaqk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZWlqd3hoY3NvY215YWhuYXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTgwMjAsImV4cCI6MjA3ODg5NDAyMH0.5TzKrWJBLVUb5Qr1KT5i5p1d30edT-vUVI5mjYveNF8';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
