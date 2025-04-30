import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function TesteSupabase() {
  useEffect(() => {
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    supabase.from('boards').select('*').then(console.log).catch(console.error);
  }, []);
  return <div>Teste Supabase</div>;
} 