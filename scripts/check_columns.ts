import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkSchema() {
  console.log('Testing slug column...');
  const { data, error } = await supabase.from('tenants').select('id, slug').limit(1);
  if (error) {
    console.error('Error selecting slug:', error);
  } else {
    console.log('Success! Columns in first row:', Object.keys(data[0] || {}));
  }
}

checkSchema();
