import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AccessRequest {
  name: string;
  email: string;
}

export async function createAccessRequest(data: AccessRequest) {
  const { data: result, error } = await supabase
    .from('landing_access_requests')
    .insert([data])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return result;
}

