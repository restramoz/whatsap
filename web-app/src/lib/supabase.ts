// src/lib/supabase.ts
// Supabase Client Singleton — uses Service Role Key for server-side write access

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
    if (!_client) {
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        }
        _client = createClient(supabaseUrl, supabaseServiceKey);
    }
    return _client;
}

export { supabaseUrl, supabaseServiceKey };
