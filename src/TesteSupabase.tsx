import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function TesteSupabase() {
  useEffect(() => {
    const supabase = createClient(
      'https://wzetgdretgibjdqkdzlw.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZXRnZHJldGdpYmpkcWtkemx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTEwODEyNywiZXhwIjoyMDYwNjg0MTI3fQ.EAWr9S0SBSEXM0O1v9GAJZcLcR_fy8s-NUw65hMHmS8'
    );
    supabase.from('boards').select('*').then(console.log).catch(console.error);
  }, []);
  return <div>Teste Supabase</div>;
} 