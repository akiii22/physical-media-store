import { createClient } from '@supabase/supabase-js';

const supabaseURL = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishbleKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if(!supabaseURL || !supabasePublishbleKey) {
    throw new Error("Missing supabase environment variable.")
}

export const supabase = createClient(supabaseURL, supabasePublishbleKey);

